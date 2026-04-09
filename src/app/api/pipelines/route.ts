import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { position: 'asc' },
        include: {
          deals: {
            orderBy: { position: 'asc' },
            include: { lead: { select: { name: true, phone: true, email: true } } },
          },
          _count: { select: { deals: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Create default pipeline if none exists
  if (pipelines.length === 0) {
    const pipeline = await prisma.pipeline.create({
      data: {
        name: 'Pipeline de Vendas',
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
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: { deals: true, _count: { select: { deals: true } } },
        },
      },
    });
    return NextResponse.json([pipeline]);
  }

  return NextResponse.json(pipelines);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  const pipeline = await prisma.pipeline.create({
    data: { name: name || 'Novo Pipeline' },
    include: { stages: true },
  });
  return NextResponse.json(pipeline, { status: 201 });
}
