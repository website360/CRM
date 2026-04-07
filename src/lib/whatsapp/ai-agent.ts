import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import type { WASocket } from '@whiskeysockets/baileys';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface IncomingMessageParams {
  channelId: number;
  contactId: string;
  contactName: string;
  text: string;
  socket: WASocket;
}

export async function handleIncomingMessage(params: IncomingMessageParams) {
  const { channelId, contactId, contactName, text, socket } = params;

  // Get or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { channelId_contactId: { channelId, contactId } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { channelId, contactId, contactName, mode: 'ai', status: 'open' },
    });
  } else if (conversation.contactName !== contactName && contactName !== contactId) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { contactName, updatedAt: new Date() },
    });
  }

  // Save incoming message & increment unread
  await prisma.message.create({
    data: { conversationId: conversation.id, sender: 'contact', content: text },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date(), unread: { increment: 1 } },
  });

  // Get channel config
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return;

  // If mode is human, don't auto-reply
  if (conversation.mode === 'human') return;

  // If AI is disabled, send welcome message only for first message
  if (!channel.aiEnabled) {
    const msgCount = await prisma.message.count({
      where: { conversationId: conversation.id, sender: 'contact' },
    });
    if (msgCount === 1 && channel.welcomeMessage) {
      await sendAndSave(socket, contactId, channel.welcomeMessage, conversation.id);
    }
    return;
  }

  // AI mode
  if (!process.env.ANTHROPIC_API_KEY) return;

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { timestamp: 'asc' },
    take: 20,
  });

  const messages: Anthropic.MessageParam[] = history.map((msg) => ({
    role: msg.sender === 'contact' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  // Merge consecutive same-role messages
  const merged: Anthropic.MessageParam[] = [];
  for (const msg of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n${msg.content}`;
    } else {
      merged.push({ ...msg });
    }
  }

  if (merged.length > 0 && merged[0].role !== 'user') merged.shift();
  if (merged.length === 0) return;

  const systemPrompt = channel.aiPrompt || getDefaultPrompt(channel.name);

  try {
    const response = await anthropic.messages.create({
      model: channel.aiModel || 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: merged,
    });

    const aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    if (aiText) {
      await sendAndSave(socket, contactId, aiText, conversation.id);
    }
  } catch (error) {
    console.error('AI response error:', error);
  }
}

async function sendAndSave(socket: WASocket, phone: string, text: string, conversationId: number) {
  await socket.sendMessage(`${phone}@s.whatsapp.net`, { text });
  await prisma.message.create({ data: { conversationId, sender: 'ai', content: text } });
}

function getDefaultPrompt(name: string): string {
  return `Você é um assistente virtual da empresa "${name}".
Responda em português do Brasil, de forma educada e objetiva.
Respostas curtas (máximo 3 frases). Se não souber, transfira para um humano.
Não invente informações sobre produtos, preços ou prazos.`;
}
