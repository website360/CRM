import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { handleIncomingMessage } from './ai-agent';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

const AUTH_DIR = path.join(process.cwd(), '.whatsapp-sessions');
const logger = pino({ level: 'silent' });
const MAX_QR_RETRIES = 3;

class WhatsAppManager {
  private sockets: Map<number, WASocket> = new Map();
  private connecting: Set<number> = new Set();

  async connect(channelId: number, attempt = 0): Promise<void> {
    if (this.connecting.has(channelId)) return;
    this.connecting.add(channelId);

    const prev = this.sockets.get(channelId);
    if (prev) { prev.end(undefined); this.sockets.delete(channelId); }

    const sessionDir = path.join(AUTH_DIR, `channel-${channelId}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const socket = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
        logger, browser: ['CRM LP', 'Chrome', '1.0.0'], connectTimeoutMs: 30000,
      });

      this.sockets.set(channelId, socket);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`[WA:${channelId}] QR Code received`);
          const config = { qrCode: qr };
          await prisma.channel.update({ where: { id: channelId }, data: { status: 'qr_code', config } }).catch(console.error);
        }

        if (connection === 'open') {
          this.connecting.delete(channelId);
          const phone = socket.user?.id?.split(':')[0] || null;
          console.log(`[WA:${channelId}] Connected! Phone: ${phone}`);
          const config = { phone };
          await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected', config } }).catch(console.error);
        }

        if (connection === 'close') {
          this.connecting.delete(channelId);
          this.sockets.delete(channelId);
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[WA:${channelId}] Closed (code: ${statusCode})`);

          if (statusCode === DisconnectReason.loggedOut) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected', config: Prisma.DbNull } }).catch(console.error);
          } else if (statusCode === DisconnectReason.restartRequired) {
            setTimeout(() => this.connect(channelId, 0), 2000);
          } else if (statusCode === 405 || statusCode === 410) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected', config: Prisma.DbNull } }).catch(console.error);
          } else if (attempt < MAX_QR_RETRIES) {
            await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } }).catch(console.error);
            setTimeout(() => this.connect(channelId, attempt + 1), 3000 * (attempt + 1));
          } else {
            await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } }).catch(console.error);
          }
        }
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
          if (msg.key.fromMe || !msg.message) continue;
          const contactPhone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
          if (!contactPhone || contactPhone === 'status') continue;
          const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
          if (!text) continue;
          handleIncomingMessage({ channelId, contactId: contactPhone, contactName: msg.pushName || contactPhone, text, socket }).catch(console.error);
        }
      });
    } catch (error) {
      this.connecting.delete(channelId);
      console.error(`[WA:${channelId}] Error:`, error);
      await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } }).catch(console.error);
    }
  }

  disconnect(channelId: number) {
    this.connecting.delete(channelId);
    const s = this.sockets.get(channelId);
    if (s) { s.end(undefined); this.sockets.delete(channelId); }
  }

  async logout(channelId: number) {
    const s = this.sockets.get(channelId);
    if (s) { try { await s.logout(); } catch {} this.sockets.delete(channelId); }
    this.connecting.delete(channelId);
    const sessionDir = path.join(AUTH_DIR, `channel-${channelId}`);
    fs.rmSync(sessionDir, { recursive: true, force: true });
    await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected', config: Prisma.DbNull } });
  }

  getSocket(channelId: number) { return this.sockets.get(channelId) || null; }

  async sendMessage(channelId: number, phone: string, text: string) {
    const s = this.getSocket(channelId);
    if (!s) throw new Error('Canal não conectado');
    await s.sendMessage(phone.includes('@') ? phone : `${phone}@s.whatsapp.net`, { text });
  }
}

const globalForWA = globalThis as unknown as { waManager: WhatsAppManager };
export const waManager = globalForWA.waManager ?? new WhatsAppManager();
if (process.env.NODE_ENV !== 'production') globalForWA.waManager = waManager;
