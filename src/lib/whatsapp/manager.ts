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
  private connecting: Set<number> = new Set(); // prevent duplicate connects

  async connect(instanceId: number, attempt = 0): Promise<void> {
    // Prevent duplicate connections
    if (this.connecting.has(instanceId)) {
      console.log(`[WA:${instanceId}] Already connecting, skipping`);
      return;
    }
    this.connecting.add(instanceId);

    // Clean previous socket
    const prev = this.sockets.get(instanceId);
    if (prev) {
      prev.end(undefined);
      this.sockets.delete(instanceId);
    }

    const sessionDir = path.join(AUTH_DIR, `instance-${instanceId}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      const socket = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: ['CRM LP', 'Chrome', '1.0.0'],
        connectTimeoutMs: 30000,
      });

      this.sockets.set(instanceId, socket);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`[WA:${instanceId}] QR Code received (attempt ${attempt + 1})`);
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'qr_code', qrCode: qr },
          }).catch(console.error);
        }

        if (connection === 'open') {
          this.connecting.delete(instanceId);
          const phone = socket.user?.id?.split(':')[0] || null;
          console.log(`[WA:${instanceId}] Connected! Phone: ${phone}`);
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'connected', qrCode: null, phone },
          }).catch(console.error);
        }

        if (connection === 'close') {
          this.connecting.delete(instanceId);
          this.sockets.delete(instanceId);

          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[WA:${instanceId}] Closed (code: ${statusCode})`);

          if (statusCode === DisconnectReason.loggedOut) {
            // Logged out - clean session
            fs.rmSync(sessionDir, { recursive: true, force: true });
            await prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: { status: 'disconnected', qrCode: null, phone: null, sessionData: Prisma.DbNull },
            }).catch(console.error);

          } else if (statusCode === DisconnectReason.restartRequired) {
            // Restart - reconnect once
            console.log(`[WA:${instanceId}] Restart required`);
            setTimeout(() => this.connect(instanceId, 0), 2000);

          } else if (statusCode === 405 || statusCode === 410 || statusCode === 440) {
            // Rate limited or version outdated - clean and stop
            console.log(`[WA:${instanceId}] Blocked (${statusCode}), cleaning session`);
            fs.rmSync(sessionDir, { recursive: true, force: true });
            await prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: { status: 'disconnected', qrCode: null },
            }).catch(console.error);

          } else if (attempt < MAX_QR_RETRIES) {
            // QR expired or connection lost - retry
            const delay = 3000 * (attempt + 1);
            console.log(`[WA:${instanceId}] Retrying in ${delay}ms (${attempt + 1}/${MAX_QR_RETRIES})`);
            await prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: { status: 'disconnected', qrCode: null },
            }).catch(console.error);
            setTimeout(() => this.connect(instanceId, attempt + 1), delay);

          } else {
            console.log(`[WA:${instanceId}] Max retries, stopped`);
            await prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: { status: 'disconnected', qrCode: null },
            }).catch(console.error);
          }
        }
      });

      socket.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (msg.key.fromMe || !msg.message) continue;

          const contactPhone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
          if (!contactPhone || contactPhone === 'status') continue;

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

          if (!text) continue;

          handleIncomingMessage({
            instanceId,
            contactPhone,
            contactName: msg.pushName || contactPhone,
            text,
            socket,
          }).catch(console.error);
        }
      });

    } catch (error) {
      this.connecting.delete(instanceId);
      console.error(`[WA:${instanceId}] Connection error:`, error);
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: 'disconnected', qrCode: null },
      }).catch(console.error);
    }
  }

  disconnect(instanceId: number): void {
    this.connecting.delete(instanceId);
    const socket = this.sockets.get(instanceId);
    if (socket) {
      socket.end(undefined);
      this.sockets.delete(instanceId);
    }
  }

  async logout(instanceId: number): Promise<void> {
    const socket = this.sockets.get(instanceId);
    if (socket) {
      try { await socket.logout(); } catch {}
      this.sockets.delete(instanceId);
    }
    this.connecting.delete(instanceId);

    const sessionDir = path.join(AUTH_DIR, `instance-${instanceId}`);
    fs.rmSync(sessionDir, { recursive: true, force: true });

    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: 'disconnected', qrCode: null, phone: null, sessionData: Prisma.DbNull },
    });
  }

  getSocket(instanceId: number): WASocket | null {
    return this.sockets.get(instanceId) || null;
  }

  async sendMessage(instanceId: number, phone: string, text: string): Promise<void> {
    const socket = this.getSocket(instanceId);
    if (!socket) throw new Error('Instância não conectada');
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await socket.sendMessage(jid, { text });
  }

  async reconnectAll(): Promise<void> {
    const instances = await prisma.whatsAppInstance.findMany({
      where: { status: 'connected' },
    });
    for (const inst of instances) {
      const sessionDir = path.join(AUTH_DIR, `instance-${inst.id}`);
      if (fs.existsSync(sessionDir)) {
        console.log(`[WA:${inst.id}] Reconnecting on startup`);
        this.connect(inst.id).catch(console.error);
      }
    }
  }
}

// Singleton
const globalForWA = globalThis as unknown as { waManager: WhatsAppManager };
export const waManager = globalForWA.waManager ?? new WhatsAppManager();
if (process.env.NODE_ENV !== 'production') {
  globalForWA.waManager = waManager;
}
