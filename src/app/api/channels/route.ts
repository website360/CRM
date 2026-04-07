import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { conversations: true } } },
  });
  return NextResponse.json(channels);
}

export async function POST(request: NextRequest) {
  const { type, name, welcomeMessage, aiEnabled, aiPrompt, config } = await request.json();
  if (!type || !name) return NextResponse.json({ error: 'Tipo e nome são obrigatórios' }, { status: 400 });

  const channel = await prisma.channel.create({
    data: { type, name, welcomeMessage, aiEnabled: aiEnabled || false, aiPrompt, config },
  });
  return NextResponse.json(channel, { status: 201 });
}
