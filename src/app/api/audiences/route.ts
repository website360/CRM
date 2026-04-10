import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const audiences = await prisma.audience.findMany({
    where: orgId ? { orgId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { campaigns: true } } },
  });

  // Recalculate match counts
  for (const audience of audiences) {
    const filters = (audience.filters || {}) as Record<string, unknown>;
    const count = await countMatches(filters);
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
  const matchCount = await countMatches(filterObj);

  const orgId = getOrgIdFromRequest(request);
  const audience = await prisma.audience.create({
    data: { name, description, filters: filterObj, matchCount, orgId },
  });
  return NextResponse.json(audience, { status: 201 });
}

async function countMatches(filters: Record<string, unknown>): Promise<number> {
  const stageIds = filters.stageIds as number[] | undefined;
  const tags = filters.tags as string[] | undefined;
  const sources = filters.sources as string[] | undefined;
  const statuses = filters.statuses as string[] | undefined;

  // If filtering by CRM stages or tags, count deals
  if ((stageIds && stageIds.length > 0) || (tags && tags.length > 0)) {
    const where: Record<string, unknown> = {};
    if (stageIds && stageIds.length > 0) where.stageId = { in: stageIds };
    // Tags are stored as comma-separated string, need to check contains
    const deals = await prisma.deal.findMany({ where, select: { tags: true, contactPhone: true } });
    let filtered = deals;
    if (tags && tags.length > 0) {
      filtered = deals.filter((d) => d.tags && tags.some((t) => d.tags!.toLowerCase().includes(t.toLowerCase())));
    }
    // Count deals with phone (can receive messages)
    return filtered.filter((d) => d.contactPhone).length;
  }

  // Otherwise count leads
  const where: Record<string, unknown> = {};
  if (sources && sources.length > 0) where.source = { in: sources };
  if (statuses && statuses.length > 0) where.status = { in: statuses };
  return prisma.lead.count({ where });
}
