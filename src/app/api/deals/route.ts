import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { stageId, title, value, contactName, contactPhone, contactEmail, notes, tags, leadId, metadata } = body;

  if (!stageId || !title) {
    return NextResponse.json({ error: 'stageId e title obrigatórios' }, { status: 400 });
  }

  const maxPos = await prisma.deal.aggregate({ where: { stageId }, _max: { position: true } });

  const deal = await prisma.deal.create({
    data: {
      stageId,
      title,
      value: value || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
      tags: tags || null,
      metadata: metadata || undefined,
      leadId: leadId || null,
      position: (maxPos._max.position || 0) + 1,
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
