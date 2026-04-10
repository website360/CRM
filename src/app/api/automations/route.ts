import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const automations = await prisma.automation.findMany({ where: orgId ? { orgId } : undefined, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(automations);
}

export async function POST(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const body = await request.json();
  const automation = await prisma.automation.create({
    data: {
      name: body.name || 'Nova Automação',
      description: body.description || null,
      trigger: body.trigger || 'manual',
      triggerConfig: body.triggerConfig || null,
      nodes: body.nodes || [],
      edges: body.edges || [],
      orgId,
    },
  });
  return NextResponse.json(automation, { status: 201 });
}
