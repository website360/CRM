import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function cors(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, { ...init, headers: { ...CORS_HEADERS, ...init.headers } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/widget?conversationId=X&after=timestamp - poll for new messages
// GET /api/widget?channelId=X - get widget config (colors, texts)
export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get('conversationId');
  const channelId = request.nextUrl.searchParams.get('channelId');
  const after = request.nextUrl.searchParams.get('after');

  // Return widget config
  if (channelId && !conversationId) {
    const channel = await prisma.channel.findUnique({ where: { id: parseInt(channelId) } });
    if (!channel || channel.type !== 'webchat') return cors({ error: 'Canal não encontrado' }, { status: 404 });

    const config = (channel.config || {}) as Record<string, unknown>;
    return cors({
      name: channel.name,
      welcomeMessage: channel.welcomeMessage,
      color: config.color || '#465FFF',
      title: config.title || 'Chat',
      subtitle: config.subtitle || 'Estamos online',
      position: config.position || 'right',
      agentName: config.agentName || 'Atendente',
      agentAvatar: config.agentAvatar || null,
      askName: config.askName !== false,
    });
  }

  // Poll messages
  if (!conversationId) return cors({ error: 'conversationId obrigatório' }, { status: 400 });

  const where: Record<string, unknown> = { conversationId: parseInt(conversationId) };
  if (after) where.timestamp = { gt: new Date(after) };

  const messages = await prisma.message.findMany({ where, orderBy: { timestamp: 'asc' } });
  return cors(messages);
}

// POST /api/widget - send message or start conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, visitorId, visitorName, text, action } = body;

    if (!channelId || !visitorId) return cors({ error: 'channelId e visitorId obrigatórios' }, { status: 400 });

    const channel = await prisma.channel.findUnique({ where: { id: parseInt(channelId) } });
    if (!channel || channel.type !== 'webchat') return cors({ error: 'Canal não encontrado' }, { status: 404 });

    // Action: start - create conversation and send welcome (no user message yet)
    if (action === 'start') {
      let conversation = await prisma.conversation.findUnique({
        where: { channelId_contactId: { channelId: channel.id, contactId: visitorId } },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            channelId: channel.id,
            contactId: visitorId,
            contactName: visitorName || 'Visitante',
            mode: channel.aiEnabled ? 'ai' : 'human',
            status: 'open',
          },
        });
      } else if (visitorName && conversation.contactName !== visitorName) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { contactName: visitorName },
        });
      }

      // Send welcome message if configured
      let welcome: string | null = null;
      if (channel.welcomeMessage) {
        // Check if we already sent welcome
        const existingWelcome = await prisma.message.findFirst({
          where: { conversationId: conversation.id, sender: 'ai' },
        });
        if (!existingWelcome) {
          await prisma.message.create({
            data: { conversationId: conversation.id, sender: 'ai', content: channel.welcomeMessage },
          });
          welcome = channel.welcomeMessage;
        }
      }

      return cors({ conversationId: conversation.id, welcome });
    }

    // Action: message (default)
    if (!text) return cors({ error: 'text obrigatório' }, { status: 400 });

    let conversation = await prisma.conversation.findUnique({
      where: { channelId_contactId: { channelId: channel.id, contactId: visitorId } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          channelId: channel.id,
          contactId: visitorId,
          contactName: visitorName || 'Visitante',
          mode: channel.aiEnabled ? 'ai' : 'human',
          status: 'open',
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: { conversationId: conversation.id, sender: 'contact', content: text },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date(), unread: { increment: 1 } },
    });

    // AI response
    if (channel.aiEnabled && conversation.mode === 'ai' && process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const history = await prisma.message.findMany({
        where: { conversationId: conversation.id },
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

      if (merged.length > 0) {
        try {
          const response = await anthropic.messages.create({
            model: channel.aiModel || 'claude-sonnet-4-6',
            max_tokens: 500,
            system: channel.aiPrompt || `Você é um assistente virtual da empresa "${channel.name}". Responda em português do Brasil, de forma educada e objetiva. Respostas curtas.`,
            messages: merged,
          });

          const aiText = response.content.filter((b) => b.type === 'text').map((b) => 'text' in b ? b.text : '').join('\n');
          if (aiText) {
            await prisma.message.create({ data: { conversationId: conversation.id, sender: 'ai', content: aiText } });
            return cors({ conversationId: conversation.id, reply: aiText });
          }
        } catch (e) {
          console.error('[Widget AI]', e);
        }
      }
    }

    return cors({ conversationId: conversation.id, reply: null });
  } catch (error) {
    console.error('[Widget]', error);
    return cors({ error: 'Erro interno' }, { status: 500 });
  }
}
