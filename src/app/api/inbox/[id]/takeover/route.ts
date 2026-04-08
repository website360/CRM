import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { mode, status } = await request.json();

  const data: Record<string, string> = {};
  if (mode && ['ai', 'human'].includes(mode)) data.mode = mode;
  if (status && ['open', 'closed'].includes(status)) data.status = status;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhuma alteração válida' }, { status: 400 });
  }

  const conversation = await prisma.conversation.update({
    where: { id: parseInt(id) },
    data,
  });

  return NextResponse.json(conversation);
}
