import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAutomations } from '@/lib/automation-runner';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // Move deal to another stage
  if (body.action === 'move') {
    // Get current deal to know the old stage
    const currentDeal = await prisma.deal.findUnique({ where: { id: parseInt(id) } });
    const fromStageId = currentDeal?.stageId;

    const deal = await prisma.deal.update({
      where: { id: parseInt(id) },
      data: { stageId: body.stageId, position: body.position || 0 },
    });

    // Trigger automations if stage actually changed
    if (fromStageId && fromStageId !== body.stageId) {
      console.log(`[Deal] ${deal.title} moved: stage ${fromStageId} → ${body.stageId}`);
      runAutomations('deal_stage_changed', {
        dealId: deal.id,
        fromStageId,
        toStageId: body.stageId,
        contactPhone: deal.contactPhone || undefined,
        contactName: deal.contactName || undefined,
        contactEmail: deal.contactEmail || undefined,
      }).catch(console.error);
    }

    return NextResponse.json(deal);
  }

  // Update deal details
  const deal = await prisma.deal.update({
    where: { id: parseInt(id) },
    data: {
      title: body.title,
      value: body.value,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      notes: body.notes,
      tags: body.tags,
    },
  });
  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
