import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const audience = await prisma.audience.update({
    where: { id: parseInt(id) },
    data: { name: body.name, description: body.description, filters: body.filters },
  });
  return NextResponse.json(audience);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.audience.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
