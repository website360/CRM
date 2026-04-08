import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  await prisma.channel.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const channelId = parseInt(id);
  const { action } = await request.json();
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (action === 'connect') {
    const config = channel.config as Record<string, string> | null;

    if (channel.type === 'whatsapp') {
      const provider = config?.provider || 'meta';

      if (provider === 'meta') {
        if (!config?.accessToken || !config?.phoneNumberId) {
          return NextResponse.json({ error: 'Configure o Access Token e Phone Number ID' }, { status: 400 });
        }
        try {
          const res = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}`, {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          });
          if (!res.ok) return NextResponse.json({ error: 'Token inválido ou Phone Number ID incorreto' }, { status: 400 });
        } catch {
          return NextResponse.json({ error: 'Erro ao verificar token' }, { status: 500 });
        }
        await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
        return NextResponse.json({ ok: true, message: 'Meta Cloud API conectado! Configure o webhook: /api/webhook/whatsapp' });
      }

      if (provider === 'zapi') {
        if (!config?.instanceId || !config?.token) {
          return NextResponse.json({ error: 'Configure Instance ID e Token da Z-API' }, { status: 400 });
        }
        await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
        return NextResponse.json({ ok: true, message: 'Z-API conectado! Configure o webhook na Z-API: /api/webhook/zapi?instance=' + config.instanceId });
      }

      if (provider === 'evolution') {
        if (!config?.serverUrl || !config?.apiKey || !config?.instanceName) {
          return NextResponse.json({ error: 'Configure URL, API Key e Nome da Instância' }, { status: 400 });
        }
        await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
        return NextResponse.json({ ok: true, message: 'Evolution API conectado! Configure o webhook na Evolution: /api/webhook/evolution' });
      }

      return NextResponse.json({ error: 'Provedor desconhecido' }, { status: 400 });
    }

    if (channel.type === 'instagram') {
      if (!config?.accessToken) {
        return NextResponse.json({ error: 'Configure o Access Token primeiro' }, { status: 400 });
      }
      await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
      return NextResponse.json({ ok: true, message: 'Instagram conectado' });
    }

    if (channel.type === 'webchat') {
      await prisma.channel.update({ where: { id: channelId }, data: { status: 'connected' } });
      return NextResponse.json({ ok: true, message: 'Webchat ativo!' });
    }
  }

  if (action === 'disconnect') {
    await prisma.channel.update({ where: { id: channelId }, data: { status: 'disconnected' } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
