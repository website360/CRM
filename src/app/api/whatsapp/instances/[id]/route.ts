import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waManager } from '@/lib/whatsapp/manager';

type Params = { params: Promise<{ id: string }> };

// GET - Instance details
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { id: parseInt(id) },
    include: { _count: { select: { conversations: true } } },
  });

  if (!instance) {
    return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
  }

  return NextResponse.json(instance);
}

// PUT - Update instance
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const instance = await prisma.whatsAppInstance.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      welcomeMessage: body.welcomeMessage,
      aiEnabled: body.aiEnabled,
      aiPrompt: body.aiPrompt,
      aiModel: body.aiModel,
    },
  });

  return NextResponse.json(instance);
}

// DELETE - Remove instance
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const instanceId = parseInt(id);

  waManager.disconnect(instanceId);

  await prisma.whatsAppInstance.delete({
    where: { id: instanceId },
  });

  return NextResponse.json({ ok: true });
}

// PATCH - Connect/Disconnect/Logout
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const instanceId = parseInt(id);
  const { action } = await request.json();

  switch (action) {
    case 'connect':
      await waManager.connect(instanceId);
      return NextResponse.json({ ok: true, message: 'Conectando... escaneie o QR Code' });

    case 'disconnect':
      waManager.disconnect(instanceId);
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: 'disconnected', qrCode: null },
      });
      return NextResponse.json({ ok: true, message: 'Desconectado' });

    case 'logout':
      await waManager.logout(instanceId);
      return NextResponse.json({ ok: true, message: 'Deslogado e sessão removida' });

    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }
}
