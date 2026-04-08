import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Webhook verification (Meta requires this)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'crm-lp-whatsapp-verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Cloud] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Receive messages from WhatsApp Cloud API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;

        if (!value.messages) continue;

        // Find channel by phone_number_id in config
        const channels = await prisma.channel.findMany({
          where: { type: 'whatsapp', status: 'connected' },
        });

        const channel = channels.find((ch) => {
          const config = ch.config as Record<string, string> | null;
          return config?.phoneNumberId === phoneNumberId;
        });

        if (!channel) {
          console.log(`[WhatsApp Cloud] No channel for phoneNumberId: ${phoneNumberId}`);
          continue;
        }

        for (const message of value.messages) {
          const senderPhone = message.from;
          const text = message.text?.body || '';
          if (!text) continue;

          // Get sender name from contacts
          const contact = value.contacts?.find((c: { wa_id: string }) => c.wa_id === senderPhone);
          const senderName = contact?.profile?.name || senderPhone;

          // Get or create conversation
          let conversation = await prisma.conversation.findUnique({
            where: { channelId_contactId: { channelId: channel.id, contactId: senderPhone } },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                channelId: channel.id,
                contactId: senderPhone,
                contactName: senderName,
                mode: channel.aiEnabled ? 'ai' : 'human',
                status: 'open',
              },
            });
          } else if (senderName !== senderPhone && conversation.contactName !== senderName) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { contactName: senderName },
            });
          }

          // Save message
          await prisma.message.create({
            data: { conversationId: conversation.id, sender: 'contact', content: text },
          });
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date(), unread: { increment: 1 } },
          });

          // AI auto-reply
          if (channel.aiEnabled && conversation.mode === 'ai' && process.env.ANTHROPIC_API_KEY) {
            const config = channel.config as Record<string, string>;
            const aiReply = await generateAIReply(channel, conversation.id);
            if (aiReply && config.accessToken) {
              await sendWhatsAppMessage(config.accessToken, config.phoneNumberId, senderPhone, aiReply);
              await prisma.message.create({
                data: { conversationId: conversation.id, sender: 'ai', content: aiReply },
              });
            }
          } else if (!channel.aiEnabled && channel.welcomeMessage) {
            // Welcome message on first contact
            const msgCount = await prisma.message.count({
              where: { conversationId: conversation.id, sender: 'contact' },
            });
            if (msgCount === 1) {
              const config = channel.config as Record<string, string>;
              if (config.accessToken) {
                await sendWhatsAppMessage(config.accessToken, config.phoneNumberId, senderPhone, channel.welcomeMessage);
                await prisma.message.create({
                  data: { conversationId: conversation.id, sender: 'ai', content: channel.welcomeMessage },
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WhatsApp Cloud] Webhook error:', error);
    return NextResponse.json({ ok: true }); // Always 200 for Meta
  }
}

async function sendWhatsAppMessage(accessToken: string, phoneNumberId: string, to: string, text: string) {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (error) {
    console.error('[WhatsApp Cloud] Send error:', error);
  }
}

async function generateAIReply(channel: { aiPrompt: string | null; aiModel: string; name: string }, conversationId: number): Promise<string | null> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    const msgs = history.map((m) => ({
      role: (m.sender === 'contact' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const merged: typeof msgs = [];
    for (const m of msgs) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) last.content += '\n' + m.content;
      else merged.push({ ...m });
    }
    if (merged[0]?.role !== 'user') merged.shift();
    if (!merged.length) return null;

    const response = await anthropic.messages.create({
      model: channel.aiModel || 'claude-sonnet-4-6',
      max_tokens: 500,
      system: channel.aiPrompt || `Você é um assistente virtual da empresa "${channel.name}". Responda em português, de forma educada e objetiva. Respostas curtas.`,
      messages: merged,
    });

    return response.content.filter((b) => b.type === 'text').map((b) => 'text' in b ? b.text : '').join('\n') || null;
  } catch (e) {
    console.error('[WhatsApp Cloud AI]', e);
    return null;
  }
}
