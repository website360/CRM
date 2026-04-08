import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instanceName = body.instance || '';

    // Handle CONNECTION_UPDATE - detect when QR is scanned
    if (body.event === 'connection.update' || body.event === 'CONNECTION_UPDATE') {
      const state = body.data?.state || body.data?.status || '';
      console.log(`[Evolution] Connection update: ${instanceName} -> ${state}`);

      const channels = await prisma.channel.findMany({
        where: { type: 'whatsapp', status: { in: ['qr_code', 'disconnected'] } },
      });
      const channel = channels.find((ch) => {
        const cfg = ch.config as Record<string, string> | null;
        return cfg?.provider === 'evolution' && cfg.instanceName === instanceName;
      });

      if (channel) {
        if (state === 'open' || state === 'connected') {
          await prisma.channel.update({
            where: { id: channel.id },
            data: { status: 'connected', config: { ...(channel.config as object), qrCode: null } },
          });
          console.log(`[Evolution] ${instanceName} connected!`);
        } else if (state === 'close' || state === 'disconnected') {
          await prisma.channel.update({
            where: { id: channel.id },
            data: { status: 'disconnected', config: { ...(channel.config as object), qrCode: null } },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Handle QRCODE_UPDATED
    if (body.event === 'qrcode.updated' || body.event === 'QRCODE_UPDATED') {
      const qrCode = body.data?.qrcode?.base64 || body.data?.base64 || null;
      if (qrCode) {
        const channels = await prisma.channel.findMany({ where: { type: 'whatsapp' } });
        const channel = channels.find((ch) => {
          const cfg = ch.config as Record<string, string> | null;
          return cfg?.provider === 'evolution' && cfg.instanceName === instanceName;
        });
        if (channel) {
          await prisma.channel.update({
            where: { id: channel.id },
            data: { status: 'qr_code', config: { ...(channel.config as object), qrCode } },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Handle MESSAGES_UPSERT
    if (body.event !== 'messages.upsert' && body.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true });
    }

    const data = body.data;
    if (!data || data.key?.fromMe) return NextResponse.json({ ok: true });

    const senderPhone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    if (!senderPhone || senderPhone.includes('@g.us')) return NextResponse.json({ ok: true });

    // Extract text from various message types
    const msg = data.message || {};
    let text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || '';
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    // Handle images
    if (msg.imageMessage) {
      mediaType = 'image';
      mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath || null;
      // Evolution may provide base64
      if (!mediaUrl && data.base64) {
        mediaUrl = `data:${msg.imageMessage.mimetype || 'image/jpeg'};base64,${data.base64}`;
      }
    }

    // Handle stickers
    if (msg.stickerMessage) {
      mediaType = 'sticker';
      mediaUrl = msg.stickerMessage.url || msg.stickerMessage.directPath || null;
      if (!mediaUrl && data.base64) {
        mediaUrl = `data:image/webp;base64,${data.base64}`;
      }
      if (!text) text = '[Figurinha]';
    }

    // Handle video
    if (msg.videoMessage) {
      mediaType = 'video';
      text = text || '[Vídeo]';
    }

    // Handle audio
    if (msg.audioMessage) {
      mediaType = 'audio';
      text = text || '[Áudio]';
    }

    // Handle document
    if (msg.documentMessage) {
      mediaType = 'document';
      text = text || `[Documento: ${msg.documentMessage.fileName || 'arquivo'}]`;
    }

    // Skip if no content at all
    if (!text && !mediaUrl) return NextResponse.json({ ok: true });

    const senderName = data.pushName || senderPhone;
    const senderProfilePic = data.profilePicUrl || null;

    const channels = await prisma.channel.findMany({
      where: { type: 'whatsapp', status: 'connected' },
    });
    const channel = channels.find((ch) => {
      const cfg = ch.config as Record<string, string> | null;
      return cfg?.provider === 'evolution' && cfg.instanceName === instanceName;
    });
    if (!channel) return NextResponse.json({ ok: true });

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { channelId_contactId: { channelId: channel.id, contactId: senderPhone } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { channelId: channel.id, contactId: senderPhone, contactName: senderName, contactAvatar: senderProfilePic, mode: channel.aiEnabled ? 'ai' : 'human', status: 'open' },
      });
    } else {
      const updates: Record<string, unknown> = {};
      if (senderName !== senderPhone && conversation.contactName !== senderName) updates.contactName = senderName;
      if (senderProfilePic && !conversation.contactAvatar) updates.contactAvatar = senderProfilePic;
      if (Object.keys(updates).length > 0) await prisma.conversation.update({ where: { id: conversation.id }, data: updates });
    }

    // Auto-create/update contact
    const existingContact = await prisma.lead.findFirst({ where: { phone: senderPhone } });
    if (!existingContact) {
      await prisma.lead.create({
        data: { name: senderName, email: `${senderPhone}@whatsapp.contact`, phone: senderPhone, source: `whatsapp-${channel.name}`, status: 'new' },
      }).catch(() => {}); // ignore duplicate email
    } else if (existingContact.name === existingContact.phone && senderName !== senderPhone) {
      await prisma.lead.update({ where: { id: existingContact.id }, data: { name: senderName } }).catch(() => {});
    }

    const content = mediaUrl ? `[imagem: ${mediaUrl}]` : text;
    await prisma.message.create({ data: { conversationId: conversation.id, sender: 'contact', content, mediaUrl, mediaType } });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date(), unread: { increment: 1 } } });

    // AI or welcome reply
    const config = channel.config as Record<string, string>;
    if (channel.aiEnabled && conversation.mode === 'ai' && process.env.ANTHROPIC_API_KEY) {
      const reply = await generateReply(channel, conversation.id);
      if (reply) {
        await sendWhatsAppMessage(config, senderPhone, reply);
        await prisma.message.create({ data: { conversationId: conversation.id, sender: 'ai', content: reply } });
      }
    } else if (!channel.aiEnabled && channel.welcomeMessage) {
      const count = await prisma.message.count({ where: { conversationId: conversation.id, sender: 'contact' } });
      if (count === 1) {
        await sendWhatsAppMessage(config, senderPhone, channel.welcomeMessage);
        await prisma.message.create({ data: { conversationId: conversation.id, sender: 'ai', content: channel.welcomeMessage } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Evolution Webhook]', error);
    return NextResponse.json({ ok: true });
  }
}

async function generateReply(channel: { aiPrompt: string | null; aiModel: string; name: string }, conversationId: number): Promise<string | null> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const history = await prisma.message.findMany({ where: { conversationId }, orderBy: { timestamp: 'asc' }, take: 20 });
    const msgs = history.map((m) => ({ role: (m.sender === 'contact' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content }));
    const merged: typeof msgs = [];
    for (const m of msgs) { const l = merged[merged.length - 1]; if (l && l.role === m.role) l.content += '\n' + m.content; else merged.push({ ...m }); }
    if (merged[0]?.role !== 'user') merged.shift();
    if (!merged.length) return null;
    const res = await anthropic.messages.create({ model: channel.aiModel || 'claude-sonnet-4-6', max_tokens: 500, system: channel.aiPrompt || `Assistente virtual de "${channel.name}". Responda em português, curto e objetivo.`, messages: merged });
    return res.content.filter((b) => b.type === 'text').map((b) => 'text' in b ? b.text : '').join('\n') || null;
  } catch { return null; }
}
