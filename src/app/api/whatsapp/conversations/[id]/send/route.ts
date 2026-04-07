import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waManager } from '@/lib/whatsapp/manager';

type Params = { params: Promise<{ id: string }> };

// POST - Send message as human
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: parseInt(id) },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  }

  // Send via WhatsApp
  await waManager.sendMessage(conversation.instanceId, conversation.contactPhone, text);

  // Save message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'human',
      content: text,
    },
  });

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
