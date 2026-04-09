import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const automation = await prisma.automation.findUnique({ where: { id: parseInt(id) } });
  if (!automation) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  return NextResponse.json(automation);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // Execute automation
  if (body.action === 'execute') {
    return executeAutomation(parseInt(id));
  }

  const automation = await prisma.automation.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      trigger: body.trigger,
      triggerConfig: body.triggerConfig,
      nodes: body.nodes,
      edges: body.edges,
    },
  });
  return NextResponse.json(automation);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.automation.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

async function executeAutomation(automationId: number) {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  const nodes = automation.nodes as Array<{ id: string; type: string; data: Record<string, string> }>;
  const edges = automation.edges as Array<{ source: string; target: string }>;

  // Find trigger node
  const triggerNode = nodes.find((n) => n.type === 'trigger');
  if (!triggerNode) return NextResponse.json({ error: 'Sem trigger configurado' }, { status: 400 });

  // Get leads based on trigger
  let leads = await prisma.lead.findMany({ where: { phone: { not: null } } });

  // Process flow: follow edges from trigger
  let currentNodeId = triggerNode.id;
  let processed = 0;

  const getNextNodes = (nodeId: string) => {
    const nextEdges = edges.filter((e) => e.source === nodeId);
    return nextEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean);
  };

  const processNode = async (node: typeof nodes[0]) => {
    if (!node) return;

    switch (node.type) {
      case 'filter': {
        const filterSource = node.data.source;
        const filterStatus = node.data.status;
        if (filterSource) leads = leads.filter((l) => l.source.includes(filterSource));
        if (filterStatus) leads = leads.filter((l) => l.status === filterStatus);
        break;
      }

      case 'delay': {
        // In real implementation, this would schedule for later
        // For now, just log
        console.log(`[Automation] Delay: ${node.data.delay || '1h'}`);
        break;
      }

      case 'send_whatsapp': {
        const channelId = parseInt(node.data.channelId || '0');
        const channel = channelId ? await prisma.channel.findUnique({ where: { id: channelId } }) : null;
        if (channel) {
          const config = channel.config as Record<string, string>;
          for (const lead of leads) {
            if (!lead.phone) continue;
            const msg = (node.data.message || '')
              .replace(/\{nome\}/gi, lead.name || '')
              .replace(/\{telefone\}/gi, lead.phone || '');
            try {
              await sendWhatsAppMessage(config, lead.phone, msg);
              processed++;
            } catch {}
          }
        }
        break;
      }

      case 'send_email': {
        const subject = node.data.subject || 'Sem assunto';
        const template = node.data.template || '';
        for (const lead of leads) {
          if (!lead.email || lead.email.endsWith('@click.track') || lead.email.endsWith('@whatsapp.contact')) continue;
          const html = template
            .replace(/\{nome\}/gi, lead.name || '')
            .replace(/\{email\}/gi, lead.email || '');
          try {
            await sendEmail(lead.email, subject, html);
            processed++;
          } catch {}
        }
        break;
      }

      case 'update_status': {
        const newStatus = node.data.newStatus || 'contacted';
        for (const lead of leads) {
          await prisma.lead.update({ where: { id: lead.id }, data: { status: newStatus } });
        }
        break;
      }

      case 'add_to_crm': {
        const pipelines = await prisma.pipeline.findMany({ include: { stages: { orderBy: { position: 'asc' }, take: 1 } } });
        if (pipelines.length > 0 && pipelines[0].stages.length > 0) {
          const stageId = pipelines[0].stages[0].id;
          for (const lead of leads) {
            await prisma.deal.create({
              data: { stageId, title: lead.name, contactName: lead.name, contactPhone: lead.phone, contactEmail: lead.email, leadId: lead.id, position: 0 },
            }).catch(() => {});
          }
        }
        break;
      }
    }

    // Process next nodes
    const nextNodes = getNextNodes(node.id);
    for (const next of nextNodes) {
      if (next) await processNode(next);
    }
  };

  // Start from trigger's next nodes
  const firstNodes = getNextNodes(currentNodeId);
  for (const node of firstNodes) {
    if (node) await processNode(node);
  }

  await prisma.automation.update({
    where: { id: automationId },
    data: { execCount: { increment: 1 }, lastRunAt: new Date() },
  });

  return NextResponse.json({ ok: true, processed });
}
