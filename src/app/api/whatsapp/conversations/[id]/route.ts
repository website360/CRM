import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET - Conversation with messages
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: parseInt(id) },
    include: {
      instance: { select: { name: true, phone: true, aiEnabled: true } },
      messages: { orderBy: { timestamp: 'asc' } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  }

  return NextResponse.json(conversation);
}
