import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';
import { sendEmail } from '@/lib/email';

type FlowNode = { id: string; type: string; data: Record<string, string> };
type FlowEdge = { source: string; target: string };

// Run all active automations that match a trigger
export async function runAutomations(trigger: string, context: {
  dealId?: number;
  leadId?: number;
  fromStageId?: number;
  toStageId?: number;
  contactPhone?: string;
  contactName?: string;
  contactEmail?: string;
}) {
  const automations = await prisma.automation.findMany({
    where: { trigger, status: 'active' },
  });

  console.log(`[Automation] Trigger "${trigger}" → ${automations.length} active automations`);

  for (const automation of automations) {
    try {
      await executeAutomation(automation, context);
    } catch (e) {
      console.error(`[Automation] Error running "${automation.name}":`, e);
    }
  }
}

async function executeAutomation(automation: { id: number; name: string; nodes: unknown; edges: unknown; [key: string]: unknown }, context: Record<string, unknown>) {
  const nodes = automation.nodes as FlowNode[];
  const edges = automation.edges as FlowEdge[];

  console.log(`[Automation] Running "${automation.name}" (${nodes.length} nodes)`);

  const triggerNode = nodes.find((n) => n.type === 'trigger');
  if (!triggerNode) return;

  // Build contacts list from context
  let contacts: { name: string; phone: string | null; email: string | null }[] = [];

  if (context.dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: context.dealId as number } });
    if (deal) contacts = [{ name: deal.contactName || deal.title, phone: deal.contactPhone, email: deal.contactEmail }];
  } else if (context.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: context.leadId as number } });
    if (lead) contacts = [{ name: lead.name, phone: lead.phone, email: lead.email }];
  } else if (context.contactPhone) {
    contacts = [{ name: (context.contactName as string) || '', phone: context.contactPhone as string, email: (context.contactEmail as string) || null }];
  }

  if (contacts.length === 0) {
    console.log(`[Automation] No contacts for "${automation.name}"`);
    return;
  }

  // Follow the flow graph
  const getNext = (nodeId: string) => edges.filter((e) => e.source === nodeId).map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as FlowNode[];

  const processNode = async (node: FlowNode) => {
    console.log(`[Automation] Node: ${node.type} - ${node.data.label || ''}`);

    switch (node.type) {
      case 'send_whatsapp': {
        const channelId = parseInt(node.data.channelId || '0');
        if (!channelId) { console.log('[Automation] No channelId for WhatsApp'); break; }
        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) { console.log(`[Automation] Channel ${channelId} not found`); break; }
        const config = channel.config as Record<string, string>;
        for (const c of contacts) {
          if (!c.phone) continue;
          const msg = (node.data.message || '').replace(/\{nome\}/gi, c.name || '').replace(/\{telefone\}/gi, c.phone || '');
          try {
            await sendWhatsAppMessage(config, c.phone, msg);
            console.log(`[Automation] WhatsApp sent to ${c.phone}`);
          } catch (e) { console.error(`[Automation] WhatsApp failed:`, e); }
        }
        break;
      }

      case 'send_email': {
        for (const c of contacts) {
          if (!c.email || c.email.endsWith('@click.track') || c.email.endsWith('@whatsapp.contact')) continue;
          const subj = (node.data.subject || '').replace(/\{nome\}/gi, c.name || '');
          const html = (node.data.template || '').replace(/\{nome\}/gi, c.name || '').replace(/\{email\}/gi, c.email || '');
          await sendEmail(c.email, subj, html);
          console.log(`[Automation] Email sent to ${c.email}`);
        }
        break;
      }

      case 'update_status': {
        if (context.leadId) {
          await prisma.lead.update({ where: { id: context.leadId as number }, data: { status: node.data.newStatus || 'contacted' } });
          console.log(`[Automation] Lead status → ${node.data.newStatus}`);
        }
        break;
      }

      case 'add_to_crm': {
        const pipelines = await prisma.pipeline.findMany({ include: { stages: { orderBy: { position: 'asc' }, take: 1 } } });
        if (pipelines.length > 0 && pipelines[0].stages.length > 0) {
          for (const c of contacts) {
            await prisma.deal.create({
              data: { stageId: pipelines[0].stages[0].id, title: c.name || 'Novo Deal', contactName: c.name, contactPhone: c.phone, contactEmail: c.email, position: 0 },
            }).catch(() => {});
          }
          console.log(`[Automation] Added to CRM`);
        }
        break;
      }

      case 'filter': {
        // For filters, we just log - actual filtering happens in campaign context
        console.log(`[Automation] Filter: source=${node.data.source} status=${node.data.status}`);
        break;
      }

      case 'delay': {
        console.log(`[Automation] Delay: ${node.data.delay} (skipped in real-time execution)`);
        break;
      }
    }

    // Process next nodes
    for (const next of getNext(node.id)) {
      await processNode(next);
    }
  };

  // Start from trigger's children
  for (const next of getNext(triggerNode.id)) {
    await processNode(next);
  }

  await prisma.automation.update({
    where: { id: automation.id },
    data: { execCount: { increment: 1 }, lastRunAt: new Date() },
  });

  console.log(`[Automation] "${automation.name}" completed`);
}
