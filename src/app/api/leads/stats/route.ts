import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const orgFilter = orgId ? { orgId } : {};

  // Lead stats
  const leads = await prisma.lead.findMany({ where: orgFilter, select: { source: true, status: true } });
  const sourceCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const lead of leads) {
    sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  }
  const statusLabels: Record<string, string> = { new: "Novo", whatsapp: "WhatsApp", contacted: "Contatado", qualified: "Qualificado", converted: "Convertido" };

  // CRM Pipeline stages with deal counts
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { deals: true } } },
      },
    },
  });

  const stages = pipelines.flatMap((p) =>
    p.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, pipelineName: p.name, count: s._count.deals }))
  );

  // Deal tags
  const deals = await prisma.deal.findMany({ select: { tags: true }, where: { tags: { not: null } } });
  const tagCounts: Record<string, number> = {};
  for (const deal of deals) {
    if (deal.tags) {
      for (const tag of deal.tags.split(',').map((t) => t.trim()).filter(Boolean)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  const totalDeals = await prisma.deal.count();

  return NextResponse.json({
    total: leads.length,
    sources: Object.entries(sourceCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    statuses: Object.entries(statusCounts).map(([value, count]) => ({ value, count, label: statusLabels[value] || value })).sort((a, b) => b.count - a.count),
    stages,
    tags: Object.entries(tagCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    totalDeals,
  });
}
