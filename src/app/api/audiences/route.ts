import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const audiences = await prisma.audience.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { campaigns: true } } },
  });

  // Recalculate match counts
  for (const audience of audiences) {
    const filters = (audience.filters || {}) as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (filters.sources && Array.isArray(filters.sources) && filters.sources.length > 0) where.source = { in: filters.sources };
    if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) where.status = { in: filters.statuses };

    const count = await prisma.lead.count({ where });
    if (count !== audience.matchCount) {
      await prisma.audience.update({ where: { id: audience.id }, data: { matchCount: count } });
      audience.matchCount = count;
    }
  }

  return NextResponse.json(audiences);
}

export async function POST(request: NextRequest) {
  const { name, description, filters } = await request.json();
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const filterObj = filters || {};
  const where: Record<string, unknown> = {};
  if (filterObj.sources?.length > 0) where.source = { in: filterObj.sources };
  if (filterObj.statuses?.length > 0) where.status = { in: filterObj.statuses };

  const matchCount = await prisma.lead.count({ where });

  const audience = await prisma.audience.create({
    data: { name, description, filters: filterObj, matchCount },
  });
  return NextResponse.json(audience, { status: 201 });
}
