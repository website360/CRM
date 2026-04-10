import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const pipelines = await prisma.pipeline.findMany({
    where: orgId ? { orgId } : undefined,
    include: {
      stages: {
        orderBy: { position: 'asc' },
        include: {
          deals: { orderBy: { position: 'asc' }, include: { lead: { select: { name: true, phone: true, email: true } } } },
          _count: { select: { deals: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (pipelines.length === 0 && orgId) {
    const pipeline = await prisma.pipeline.create({
      data: {
        name: 'Pipeline de Vendas', orgId,
        stages: {
          create: [
            { name: 'Novo Lead', color: '#465FFF', position: 0 },
            { name: 'Contato Feito', color: '#0BA5EC', position: 1 },
            { name: 'Proposta Enviada', color: '#F79009', position: 2 },
            { name: 'Negociação', color: '#7A5AF8', position: 3 },
            { name: 'Fechado/Ganho', color: '#12B76A', position: 4 },
            { name: 'Perdido', color: '#F04438', position: 5 },
          ],
        },
      },
      include: { stages: { orderBy: { position: 'asc' }, include: { deals: true, _count: { select: { deals: true } } } } },
    });
    return NextResponse.json([pipeline]);
  }

  return NextResponse.json(pipelines);
}

export async function POST(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const { name } = await request.json();
  const pipeline = await prisma.pipeline.create({
    data: { name: name || 'Novo Pipeline', orgId },
    include: { stages: true },
  });
  return NextResponse.json(pipeline, { status: 201 });
}
