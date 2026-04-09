import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: parseInt(id) },
    include: {
      audience: true,
      actions: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });
  if (!campaign) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const campaign = await prisma.campaign.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status,
      audienceId: body.audienceId,
      channelType: body.channelType,
      channelId: body.channelId,
      message: body.message,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  });
  return NextResponse.json(campaign);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
