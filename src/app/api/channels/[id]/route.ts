import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waManager } from '@/lib/whatsapp/manager';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const channel = await prisma.channel.findUnique({ where: { id: parseInt(id) }, include: { _count: { select: { conversations: true } } } });
  if (!channel) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(channel);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const channel = await prisma.channel.update({
    where: { id: parseInt(id) },
    data: { name: body.name, welcomeMessage: body.welcomeMessage, aiEnabled: body.aiEnabled, aiPrompt: body.aiPrompt, aiModel: body.aiModel, config: body.config },
  });
  return NextResponse.json(channel);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const channelId = parseInt(id);
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (channel?.type === 'whatsapp') waManager.disconnect(channelId);
  await prisma.channel.delete({ where: { id: channelId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const channelId = parseInt(id);
  const { action } = await request.json();
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (channel.type === 'whatsapp') {
    switch (action) {
      case 'connect':
        await waManager.connect(channelId);
        return NextResponse.json({ ok: true, message: 'Conectando... escaneie o QR Code' });
      case 'disconnect':
        waManager.disconnect(channelId);
        await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } });
        return NextResponse.json({ ok: true });
      case 'logout':
        await waManager.logout(channelId);
        return NextResponse.json({ ok: true });
    }
  }

  if (channel.type === 'instagram') {
    if (action === 'connect') {
      // Instagram uses token-based auth, mark as connected if token exists
      const config = channel.config as Record<string, string> | null;
      if (config?.accessToken) {
        await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
        return NextResponse.json({ ok: true, message: 'Instagram conectado' });
      }
      return NextResponse.json({ error: 'Configure o Access Token primeiro' }, { status: 400 });
    }
    if (action === 'disconnect') {
      await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } });
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
