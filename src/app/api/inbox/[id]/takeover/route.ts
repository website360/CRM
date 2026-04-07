import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { mode } = await request.json();
  if (!['ai', 'human'].includes(mode)) return NextResponse.json({ error: 'Modo inválido' }, { status: 400 });
  const conversation = await prisma.conversation.update({ where: { id: parseInt(id) }, data: { mode } });
  return NextResponse.json(conversation);
}
