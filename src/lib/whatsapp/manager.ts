import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { handleIncomingMessage } from './ai-agent';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(process.cwd(), '.whatsapp-sessions');

interface InstanceConnection {
  socket: WASocket;
  instanceId: number;
}

class WhatsAppManager {
  private connections: Map<number, InstanceConnection> = new Map();
  private qrCallbacks: Map<number, (qr: string) => void> = new Map();

  async connect(instanceId: number): Promise<void> {
    // Disconnect existing connection if any
    this.disconnect(instanceId);

    const sessionDir = path.join(AUTH_DIR, `instance-${instanceId}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['CRM LP', 'Chrome', '1.0.0'],
    });

    this.connections.set(instanceId, { socket, instanceId });

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Save QR code to database
        await prisma.whatsAppInstance.update({
          where: { id: instanceId },
          data: { status: 'qr_code', qrCode: qr },
        });

        // Notify QR callback if any
        const callback = this.qrCallbacks.get(instanceId);
        if (callback) callback(qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        await prisma.whatsAppInstance.update({
          where: { id: instanceId },
          data: {
            status: 'disconnected',
            qrCode: null,
            ...(statusCode === DisconnectReason.loggedOut ? { sessionData: Prisma.DbNull } : {}),
          },
        });

        if (shouldReconnect) {
          // Retry connection
          setTimeout(() => this.connect(instanceId), 3000);
        } else {
          // User logged out, clean session
          this.connections.delete(instanceId);
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true });
          }
        }
      }

      if (connection === 'open') {
        const phone = socket.user?.id?.split(':')[0] || null;
        await prisma.whatsAppInstance.update({
          where: { id: instanceId },
          data: {
            status: 'connected',
            qrCode: null,
            phone,
          },
        });
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

        const contactName = msg.pushName || contactPhone;

        await handleIncomingMessage({
          instanceId,
          contactPhone,
          contactName,
          text,
          socket,
        });
      }
    });
  }

  disconnect(instanceId: number): void {
    const conn = this.connections.get(instanceId);
    if (conn) {
      conn.socket.end(undefined);
      this.connections.delete(instanceId);
    }
    this.qrCallbacks.delete(instanceId);
  }

  async logout(instanceId: number): Promise<void> {
    const conn = this.connections.get(instanceId);
    if (conn) {
      await conn.socket.logout();
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

  onQR(instanceId: number, callback: (qr: string) => void): void {
    this.qrCallbacks.set(instanceId, callback);
  }

  async sendMessage(instanceId: number, phone: string, text: string): Promise<void> {
    const socket = this.getSocket(instanceId);
    if (!socket) throw new Error('Instância não conectada');

    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await socket.sendMessage(jid, { text });
  }

  // Reconnect all active instances on startup
  async reconnectAll(): Promise<void> {
    const instances = await prisma.whatsAppInstance.findMany({
      where: { status: 'connected' },
    });

    for (const instance of instances) {
      const sessionDir = path.join(AUTH_DIR, `instance-${instance.id}`);
      if (fs.existsSync(sessionDir)) {
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
