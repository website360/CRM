import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import type { WASocket } from '@whiskeysockets/baileys';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface IncomingMessageParams {
  instanceId: number;
  contactPhone: string;
  contactName: string;
  text: string;
  socket: WASocket;
}

export async function handleIncomingMessage(params: IncomingMessageParams) {
  const { instanceId, contactPhone, contactName, text, socket } = params;

  // Get or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      instanceId_contactPhone: { instanceId, contactPhone },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        instanceId,
        contactPhone,
        contactName,
        mode: 'ai',
        status: 'open',
      },
    });
  } else if (conversation.contactName !== contactName && contactName !== contactPhone) {
    // Update contact name if changed
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { contactName, updatedAt: new Date() },
    });
  }

  // Save incoming message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'contact',
      content: text,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  // Get instance config
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { id: instanceId },
  });

  if (!instance) return;

  // If mode is human, don't auto-reply
  if (conversation.mode === 'human') return;

  // If AI is disabled, send welcome message only for first message
  if (!instance.aiEnabled) {
    const msgCount = await prisma.message.count({
      where: { conversationId: conversation.id, sender: 'contact' },
    });

    if (msgCount === 1 && instance.welcomeMessage) {
      await sendAndSave(socket, contactPhone, instance.welcomeMessage, conversation.id);
    }
    return;
  }

  // AI mode - generate response
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set, skipping AI response');
    return;
  }

  // Get conversation history (last 20 messages)
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { timestamp: 'asc' },
    take: 20,
  });

  // Build messages for Claude
  const messages: Anthropic.MessageParam[] = history.map((msg) => ({
    role: msg.sender === 'contact' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  // Merge consecutive messages with same role
  const mergedMessages: Anthropic.MessageParam[] = [];
  for (const msg of messages) {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n${msg.content}`;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  // Ensure first message is from user
  if (mergedMessages.length > 0 && mergedMessages[0].role !== 'user') {
    mergedMessages.shift();
  }

  if (mergedMessages.length === 0) return;

  const systemPrompt = instance.aiPrompt || getDefaultPrompt(instance.name);

  try {
    const response = await anthropic.messages.create({
      model: instance.aiModel || 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: mergedMessages,
    });

    const aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    if (aiText) {
      await sendAndSave(socket, contactPhone, aiText, conversation.id);
    }
  } catch (error) {
    console.error('AI response error:', error);
  }
}

async function sendAndSave(
  socket: WASocket,
  phone: string,
  text: string,
  conversationId: number,
) {
  const jid = `${phone}@s.whatsapp.net`;
  await socket.sendMessage(jid, { text });

  await prisma.message.create({
    data: {
      conversationId,
      sender: 'ai',
      content: text,
    },
  });
}

function getDefaultPrompt(businessName: string): string {
  return `Você é um assistente virtual da empresa "${businessName}".
Seu papel é atender clientes de forma educada, profissional e objetiva.

Regras:
- Responda sempre em português do Brasil
- Seja cordial e prestativo
- Respostas curtas e diretas (máximo 3 frases quando possível)
- Se não souber a resposta, diga que vai transferir para um atendente humano
- Não invente informações sobre produtos, preços ou prazos
- Colete nome e necessidade do cliente quando possível`;
}
