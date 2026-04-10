import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  let orgId: number | null = null;
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) { const p = verifyToken(authToken); if (p?.orgId) orgId = p.orgId; }

  const channels = await prisma.channel.findMany({
    where: orgId ? { orgId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { conversations: true } } },
  });
  return NextResponse.json(channels);
}

export async function POST(request: NextRequest) {
  const { type, name, welcomeMessage, aiEnabled, aiPrompt, config } = await request.json();
  if (!type || !name) return NextResponse.json({ error: 'Tipo e nome são obrigatórios' }, { status: 400 });

  let orgId: number | null = null;
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) { const p = verifyToken(authToken); if (p?.orgId) orgId = p.orgId; }

  const channel = await prisma.channel.create({
    data: { type, name, welcomeMessage, aiEnabled: aiEnabled || false, aiPrompt, config, orgId },
  });
  return NextResponse.json(channel, { status: 201 });
}
