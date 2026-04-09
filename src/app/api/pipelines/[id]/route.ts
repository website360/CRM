import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PUT - Update pipeline or manage stages
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // Add stage
  if (body.action === 'addStage') {
    const maxPos = await prisma.stage.aggregate({ where: { pipelineId: parseInt(id) }, _max: { position: true } });
    const stage = await prisma.stage.create({
      data: {
        pipelineId: parseInt(id),
        name: body.name || 'Nova Etapa',
        color: body.color || '#465FFF',
        position: (maxPos._max.position || 0) + 1,
      },
    });
    return NextResponse.json(stage, { status: 201 });
  }

  // Update stage
  if (body.action === 'updateStage') {
    const stage = await prisma.stage.update({
      where: { id: body.stageId },
      data: { name: body.name, color: body.color },
    });
    return NextResponse.json(stage);
  }

  // Delete stage
  if (body.action === 'deleteStage') {
    await prisma.stage.delete({ where: { id: body.stageId } });
    return NextResponse.json({ ok: true });
  }

  // Reorder stages
  if (body.action === 'reorderStages' && Array.isArray(body.stageIds)) {
    await Promise.all(
      body.stageIds.map((stageId: number, i: number) =>
        prisma.stage.update({ where: { id: stageId }, data: { position: i } })
      )
    );
    return NextResponse.json({ ok: true });
  }

  // Update pipeline name
  const pipeline = await prisma.pipeline.update({
    where: { id: parseInt(id) },
    data: { name: body.name },
  });
  return NextResponse.json(pipeline);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.pipeline.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
