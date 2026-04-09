import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const automations = await prisma.automation.findMany({ orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(automations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const automation = await prisma.automation.create({
    data: {
      name: body.name || 'Nova Automação',
      description: body.description || null,
      trigger: body.trigger || 'manual',
      triggerConfig: body.triggerConfig || null,
      nodes: body.nodes || [],
      edges: body.edges || [],
    },
  });
  return NextResponse.json(automation, { status: 201 });
}
