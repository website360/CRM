import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST - Receive message from chat widget
export async function POST(request: NextRequest) {
  try {
    const { channelId, visitorId, visitorName, text } = await request.json();

    if (!channelId || !visitorId || !text) {
      return NextResponse.json({ error: 'channelId, visitorId e text são obrigatórios' }, { status: 400, headers: CORS_HEADERS });
    }

    const channel = await prisma.channel.findUnique({ where: { id: parseInt(channelId) } });
    if (!channel || channel.type !== 'webchat') {
      return NextResponse.json({ error: 'Canal webchat não encontrado' }, { status: 404, headers: CORS_HEADERS });
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { channelId_contactId: { channelId: channel.id, contactId: visitorId } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          channelId: channel.id,
          contactId: visitorId,
          contactName: visitorName || `Visitante ${visitorId.slice(0, 6)}`,
          mode: channel.aiEnabled ? 'ai' : 'human',
          status: 'open',
        },
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

    // If AI enabled, generate response
    if (channel.aiEnabled && conversation.mode === 'ai' && process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const history = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { timestamp: 'asc' },
        take: 20,
      });

      const messages = history.map((m) => ({
        role: (m.sender === 'contact' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      // Merge consecutive same role
      const merged: typeof messages = [];
      for (const msg of messages) {
        const last = merged[merged.length - 1];
        if (last && last.role === msg.role) last.content += '\n' + msg.content;
        else merged.push({ ...msg });
      }
      if (merged[0]?.role !== 'user') merged.shift();

      if (merged.length > 0) {
        const systemPrompt = channel.aiPrompt || `Você é um assistente virtual da empresa "${channel.name}". Responda em português do Brasil, de forma educada e objetiva. Respostas curtas (máximo 3 frases).`;

        try {
          const response = await anthropic.messages.create({
            model: channel.aiModel || 'claude-sonnet-4-6',
            max_tokens: 500,
            system: systemPrompt,
            messages: merged,
          });

          const aiText = response.content
            .filter((b) => b.type === 'text')
            .map((b) => 'text' in b ? b.text : '')
            .join('\n');

          if (aiText) {
            await prisma.message.create({
              data: { conversationId: conversation.id, sender: 'ai', content: aiText },
            });

            return NextResponse.json({
              conversationId: conversation.id,
              reply: aiText,
            }, { headers: CORS_HEADERS });
          }
        } catch (e) {
          console.error('[Widget AI] Error:', e);
        }
      }
    }

    // Welcome message for first contact (no AI)
    if (!channel.aiEnabled && channel.welcomeMessage) {
      const msgCount = await prisma.message.count({
        where: { conversationId: conversation.id, sender: 'contact' },
      });
      if (msgCount === 1) {
        await prisma.message.create({
          data: { conversationId: conversation.id, sender: 'ai', content: channel.welcomeMessage },
        });
        return NextResponse.json({
          conversationId: conversation.id,
          reply: channel.welcomeMessage,
        }, { headers: CORS_HEADERS });
      }
    }

    return NextResponse.json({ conversationId: conversation.id, reply: null }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[Widget] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500, headers: CORS_HEADERS });
  }
}

// GET - Get messages for a conversation (polling)
export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get('conversationId');
  const after = request.nextUrl.searchParams.get('after');

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId obrigatório' }, { status: 400, headers: CORS_HEADERS });
  }

  const where: Record<string, unknown> = { conversationId: parseInt(conversationId) };
  if (after) {
    where.timestamp = { gt: new Date(after) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });

  return NextResponse.json(messages, { headers: CORS_HEADERS });
}
