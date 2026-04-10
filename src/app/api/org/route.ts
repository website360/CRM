import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const org = await prisma.organization.findUnique({ where: { id: user.orgId }, include: { plan: true, _count: { select: { users: true, leads: true, channels: true } } } });
  return NextResponse.json(org);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.website !== undefined) data.website = body.website;
  if (body.address !== undefined) data.address = body.address;
  if (body.logo !== undefined) data.logo = body.logo;
  if (body.planId !== undefined) data.planId = body.planId;

  const org = await prisma.organization.update({ where: { id: user.orgId }, data });
  return NextResponse.json(org);
}
