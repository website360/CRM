import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Get unique sources and statuses with counts
  const leads = await prisma.lead.findMany({
    select: { source: true, status: true },
  });

  const sourceCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  for (const lead of leads) {
    sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  }

  const sources = Object.entries(sourceCounts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  const statuses = Object.entries(statusCounts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  const statusLabels: Record<string, string> = {
    new: "Novo", whatsapp: "WhatsApp", contacted: "Contatado",
    qualified: "Qualificado", converted: "Convertido",
  };

  return NextResponse.json({
    total: leads.length,
    sources,
    statuses: statuses.map((s) => ({ ...s, label: statusLabels[s.value] || s.value })),
  });
}
