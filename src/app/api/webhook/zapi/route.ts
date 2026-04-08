import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

// POST - Receive messages from Z-API webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Z-API sends: { phone, fromMe, messageId, chatName, text: { message }, momment, ... }
    if (body.fromMe) return NextResponse.json({ ok: true });

    const senderPhone = body.phone?.replace(/\D/g, '') || '';
    const text = body.text?.message || body.message?.text || '';
    if (!senderPhone || !text) return NextResponse.json({ ok: true });

    const senderName = body.chatName || body.senderName || senderPhone;

    // Find channel by Z-API instance ID from query param or match all zapi channels
    const instanceId = request.nextUrl.searchParams.get('instance') || '';

    const channels = await prisma.channel.findMany({
      where: { type: 'whatsapp', status: 'connected' },
    });

    const channel = channels.find((ch) => {
      const config = ch.config as Record<string, string> | null;
      return config?.provider === 'zapi' && (instanceId ? config.instanceId === instanceId : true);
    });

    if (!channel) return NextResponse.json({ ok: true });

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { channelId_contactId: { channelId: channel.id, contactId: senderPhone } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { channelId: channel.id, contactId: senderPhone, contactName: senderName, mode: channel.aiEnabled ? 'ai' : 'human', status: 'open' },
      });
    } else if (senderName !== senderPhone && conversation.contactName !== senderName) {
      await prisma.conversation.update({ where: { id: conversation.id }, data: { contactName: senderName } });
    }

    await prisma.message.create({ data: { conversationId: conversation.id, sender: 'contact', content: text } });
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
    console.error('[Z-API Webhook]', error);
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
