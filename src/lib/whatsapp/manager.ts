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

// Silent logger for Baileys (reduce noise)
const logger = pino({ level: 'silent' });

interface InstanceConnection {
  socket: WASocket;
  instanceId: number;
  retryCount: number;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

class WhatsAppManager {
  private connections: Map<number, InstanceConnection> = new Map();

  async connect(instanceId: number, retryCount = 0): Promise<void> {
    // Disconnect existing connection if any
    const existing = this.connections.get(instanceId);
    if (existing) {
      existing.socket.end(undefined);
      this.connections.delete(instanceId);
    }

    const sessionDir = path.join(AUTH_DIR, `instance-${instanceId}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: true, // Also print in terminal for debugging
      logger,
      browser: ['CRM LP', 'Chrome', '1.0.0'],
      connectTimeoutMs: 30000,
      qrTimeout: 60000,
    });

    this.connections.set(instanceId, { socket, instanceId, retryCount });

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WA:${instanceId}] QR Code generated`);
        try {
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'qr_code', qrCode: qr },
          });
        } catch (e) {
          console.error(`[WA:${instanceId}] Failed to save QR:`, e);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const reason = DisconnectReason;
        console.log(`[WA:${instanceId}] Connection closed, statusCode: ${statusCode}`);

        this.connections.delete(instanceId);

        if (statusCode === reason.loggedOut) {
          // User logged out - clean everything
          console.log(`[WA:${instanceId}] Logged out, cleaning session`);
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true });
          }
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'disconnected', qrCode: null, phone: null, sessionData: Prisma.DbNull },
          });
        } else if (statusCode === reason.restartRequired) {
          // Restart required - reconnect immediately
          console.log(`[WA:${instanceId}] Restart required, reconnecting...`);
          this.connect(instanceId, 0);
        } else if (retryCount < MAX_RETRIES) {
          // Retry with backoff
          const delay = RETRY_DELAY * (retryCount + 1);
          console.log(`[WA:${instanceId}] Reconnecting in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'disconnected', qrCode: null },
          });
          setTimeout(() => this.connect(instanceId, retryCount + 1), delay);
        } else {
          console.log(`[WA:${instanceId}] Max retries reached, giving up`);
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { status: 'disconnected', qrCode: null },
          });
        }
      }

      if (connection === 'open') {
        const phone = socket.user?.id?.split(':')[0] || null;
        console.log(`[WA:${instanceId}] Connected! Phone: ${phone}`);
        await prisma.whatsAppInstance.update({
          where: { id: instanceId },
          data: { status: 'connected', qrCode: null, phone },
        });
        // Reset retry count on successful connection
        const conn = this.connections.get(instanceId);
        if (conn) conn.retryCount = 0;
      }
    });

    // Save credentials on update
    socket.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        if (!msg.message) continue;

        const contactPhone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
        if (!contactPhone || contactPhone === 'status') continue;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        if (!text) continue;

        const contactName = msg.pushName || contactPhone;

        try {
          await handleIncomingMessage({
            instanceId,
            contactPhone,
            contactName,
            text,
            socket,
          });
        } catch (e) {
          console.error(`[WA:${instanceId}] Error handling message:`, e);
        }
      }
    });
  }

  disconnect(instanceId: number): void {
    const conn = this.connections.get(instanceId);
    if (conn) {
      conn.socket.end(undefined);
      this.connections.delete(instanceId);
    }
  }

  async logout(instanceId: number): Promise<void> {
    const conn = this.connections.get(instanceId);
    if (conn) {
      try {
        await conn.socket.logout();
      } catch (e) {
        // Ignore logout errors
      }
      this.connections.delete(instanceId);
    }

    const sessionDir = path.join(AUTH_DIR, `instance-${instanceId}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true });
    }

    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: 'disconnected', qrCode: null, phone: null, sessionData: Prisma.DbNull },
    });
  }

  getSocket(instanceId: number): WASocket | null {
    return this.connections.get(instanceId)?.socket || null;
  }

  isConnected(instanceId: number): boolean {
    return this.connections.has(instanceId);
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

    for (const instance of instances) {
      const sessionDir = path.join(AUTH_DIR, `instance-${instance.id}`);
      if (fs.existsSync(sessionDir)) {
        console.log(`[WA:${instance.id}] Reconnecting on startup...`);
        this.connect(instance.id).catch(console.error);
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
