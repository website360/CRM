import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';
import { getSetting } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instanceName = body.instance || '';
    console.log(`[Evolution] Event: ${body.event} | Instance: ${instanceName} | HasData: ${!!body.data}`);

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
    if (!data) return NextResponse.json({ ok: true });

    const isFromMe = data.key?.fromMe === true;
    const contactPhone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    if (!contactPhone || contactPhone.includes('@g.us')) return NextResponse.json({ ok: true });

    // Rename for clarity
    const senderPhone = contactPhone;

    // Extract text from various message types
    const msg = data.message || {};
    let text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || '';
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    // Evolution v2 provides media as base64 in the webhook payload
    // or as a downloadable URL via their media endpoint
    const evoUrl = ((await getSetting('EVOLUTION_API_URL')) || '').replace(/\/$/, '');
    const evoKey = (await getSetting('EVOLUTION_API_KEY')) || '';

    // Handle images
    if (msg.imageMessage) {
      mediaType = 'image';
      const mime = msg.imageMessage.mimetype || 'image/jpeg';
      // Try all possible base64 locations in Evolution webhook
      const b64 = data.message?.base64 || data.base64 || body.data?.message?.base64 || msg.imageMessage.base64 || null;
      console.log(`[Evolution] Image: mime=${mime} hasBase64=${!!b64} hasUrl=${!!msg.imageMessage.url} keys=${Object.keys(data).join(',')}`);
      if (b64) {
        mediaUrl = `data:${mime};base64,${b64}`;
      } else if (data.base64) {
        mediaUrl = `data:${mime};base64,${data.base64}`;
      } else if (msg.imageMessage.url) {
        mediaUrl = msg.imageMessage.url;
      } else if (data.key?.id && evoUrl) {
        // Try to download from Evolution API
        try {
          const mediaRes = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', apikey: evoKey },
            body: JSON.stringify({ message: { key: data.key, message: data.message } }),
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            if (mediaData.base64) mediaUrl = `data:${msg.imageMessage.mimetype || 'image/jpeg'};base64,${mediaData.base64}`;
          }
        } catch (e) { console.error('[Evolution] Media download error:', e); }
      }
    }

    // Handle stickers
    if (msg.stickerMessage) {
      mediaType = 'sticker';
      if (data.message?.base64) {
        mediaUrl = `data:image/webp;base64,${data.message.base64}`;
      } else if (data.base64) {
        mediaUrl = `data:image/webp;base64,${data.base64}`;
      } else if (data.key?.id && evoUrl) {
        try {
          const mediaRes = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', apikey: evoKey },
            body: JSON.stringify({ message: { key: data.key, message: data.message } }),
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            if (mediaData.base64) mediaUrl = `data:image/webp;base64,${mediaData.base64}`;
          }
        } catch (e) { console.error('[Evolution] Sticker download error:', e); }
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
      const b64Audio = data.message?.base64 || data.base64 || null;
      if (b64Audio) {
        mediaUrl = `data:${msg.audioMessage.mimetype || 'audio/ogg'};base64,${b64Audio}`;
      } else if (data.key?.id && evoUrl) {
        try {
          const mediaRes = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', apikey: evoKey },
            body: JSON.stringify({ message: { key: data.key, message: data.message } }),
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            if (mediaData.base64) mediaUrl = `data:${msg.audioMessage.mimetype || 'audio/ogg'};base64,${mediaData.base64}`;
          }
        } catch (e) { console.error('[Evolution] Audio download error:', e); }
      }
      text = text || '[Áudio]';
    }

    // Handle document
    if (msg.documentMessage) {
      mediaType = 'document';
      text = text || `[Documento: ${msg.documentMessage.fileName || 'arquivo'}]`;
    }

    console.log(`[Evolution] ${isFromMe ? 'Sent' : 'Received'} ${senderPhone}: text="${text?.slice(0, 50)}" mediaType=${mediaType}`);

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
      where: { channelId_contactId: { channelId: channel.id, contactId: contactPhone } },
    });

    if (!conversation) {
      if (isFromMe) return NextResponse.json({ ok: true }); // Don't create conversation from sent messages
      conversation = await prisma.conversation.create({
        data: { channelId: channel.id, contactId: contactPhone, contactName: senderName, contactAvatar: senderProfilePic, mode: channel.aiEnabled ? 'ai' : 'human', status: 'open' },
      });
    } else if (!isFromMe) {
      const updates: Record<string, unknown> = {};
      if (senderName !== senderPhone && conversation.contactName !== senderName) updates.contactName = senderName;
      if (senderProfilePic && !conversation.contactAvatar) updates.contactAvatar = senderProfilePic;
      if (Object.keys(updates).length > 0) await prisma.conversation.update({ where: { id: conversation.id }, data: updates });
    }

    const content = mediaUrl ? `[imagem: ${mediaUrl}]` : text;

    // If sent by us (fromMe), save as "human" message
    if (isFromMe) {
      // Check if we already saved this message (sent via CRM)
      const recentMsg = await prisma.message.findFirst({
        where: { conversationId: conversation.id, sender: 'human', content, timestamp: { gte: new Date(Date.now() - 5000) } },
      });
      if (!recentMsg) {
        await prisma.message.create({ data: { conversationId: conversation.id, sender: 'human', content, mediaUrl, mediaType } });
        await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      }
      return NextResponse.json({ ok: true });
    }

    // Received message - save and process
    // Auto-create/update contact
    const existingContact = await prisma.lead.findFirst({ where: { phone: senderPhone } });
    if (!existingContact) {
      await prisma.lead.create({
        data: { name: senderName, email: `${senderPhone}@whatsapp.contact`, phone: senderPhone, source: `whatsapp-${channel.name}`, status: 'new' },
      }).catch(() => {});
    } else if (existingContact.name === existingContact.phone && senderName !== senderPhone) {
      await prisma.lead.update({ where: { id: existingContact.id }, data: { name: senderName } }).catch(() => {});
    }

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
