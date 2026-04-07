import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: parseInt(id) },
    include: {
      channel: { select: { name: true, type: true, config: true, aiEnabled: true } },
      messages: { orderBy: { timestamp: 'asc' } },
    },
  });
  if (!conversation) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  // Mark as read
  if (conversation.unread > 0) {
    await prisma.conversation.update({ where: { id: conversation.id }, data: { unread: 0 } });
  }

  return NextResponse.json(conversation);
}
