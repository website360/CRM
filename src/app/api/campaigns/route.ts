import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      audience: { select: { name: true, matchCount: true } },
      _count: { select: { actions: true } },
    },
  });
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, type, audienceId, channelType, channelId, message, scheduledAt, action } = body;

  // Action: send campaign now
  if (action === 'send' && body.id) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.id },
      include: { audience: true },
    });
    if (!campaign || !campaign.audience) return NextResponse.json({ error: 'Campanha ou audiência não encontrada' }, { status: 404 });

    // Get contacts matching audience (from CRM deals or leads)
    const filters = (campaign.audience.filters || {}) as Record<string, unknown>;
    const stageIds = filters.stageIds as number[] | undefined;
    const filterTags = filters.tags as string[] | undefined;

    type Contact = { id: number; name: string; phone: string | null; email: string | null };
    let contacts: Contact[] = [];

    if ((stageIds && stageIds.length > 0) || (filterTags && filterTags.length > 0)) {
      // Filter from CRM deals
      const dealWhere: Record<string, unknown> = {};
      if (stageIds && stageIds.length > 0) dealWhere.stageId = { in: stageIds };
      let deals = await prisma.deal.findMany({ where: dealWhere, select: { id: true, contactName: true, contactPhone: true, contactEmail: true, tags: true } });
      if (filterTags && filterTags.length > 0) {
        deals = deals.filter((d) => d.tags && filterTags.some((t) => d.tags!.toLowerCase().includes(t.toLowerCase())));
      }
      contacts = deals.map((d) => ({ id: d.id, name: d.contactName || '', phone: d.contactPhone, email: d.contactEmail }));
    } else {
      // Filter from leads
      const leadWhere: Record<string, unknown> = {};
      const sources = filters.sources as string[] | undefined;
      const statuses = filters.statuses as string[] | undefined;
      if (sources && sources.length > 0) leadWhere.source = { in: sources };
      if (statuses && statuses.length > 0) leadWhere.status = { in: statuses };
      const leads = await prisma.lead.findMany({ where: leadWhere, select: { id: true, name: true, phone: true, email: true } });
      contacts = leads;
    }

    let sentCount = 0;

    // Send via Email (SMTP)
    if (campaign.channelType === 'email') {
      const { sendEmail } = await import('@/lib/email');
      const emailSubject = campaign.description || 'Sem assunto';

      for (const contact of contacts) {
        if (!contact.email || contact.email.endsWith('@click.track') || contact.email.endsWith('@whatsapp.contact')) continue;
        try {
          const html = (campaign.message || '')
            .replace(/\{nome\}/gi, contact.name || '')
            .replace(/\{email\}/gi, contact.email || '')
            .replace(/\{telefone\}/gi, contact.phone || '');
          const subj = emailSubject
            .replace(/\{nome\}/gi, contact.name || '');

          await sendEmail(contact.email, subj, html);
          await prisma.campaignAction.create({ data: { campaignId: campaign.id, leadId: contact.id, action: 'sent' } });
          sentCount++;
        } catch (e) {
          console.error(`[Campaign] Email failed to ${contact.email}:`, e);
        }
      }

      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'completed', sentCount: { increment: sentCount } } });
      return NextResponse.json({ ok: true, sentCount });
    }

    // Send via WhatsApp channel
    if (campaign.channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: campaign.channelId } });
      if (channel && campaign.message) {
        const config = channel.config as Record<string, string>;

        for (const contact of contacts) {
          if (!contact.phone) continue;
          try {
            const personalMsg = campaign.message
              .replace(/\{nome\}/gi, contact.name || '')
              .replace(/\{telefone\}/gi, contact.phone || '')
              .replace(/\{email\}/gi, contact.email || '');

            await sendWhatsAppMessage(config, contact.phone, personalMsg);
            await prisma.campaignAction.create({ data: { campaignId: campaign.id, leadId: contact.id, action: 'sent' } });
            sentCount++;
          } catch (e) {
            console.error(`[Campaign] WhatsApp failed to ${contact.phone}:`, e);
          }
        }

        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'completed', sentCount: { increment: sentCount } } });
        return NextResponse.json({ ok: true, sentCount });
      }
    }

    return NextResponse.json({ error: 'Canal não configurado' }, { status: 400 });
  }

  // Create campaign
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      type: type || 'manual',
      audienceId: audienceId || null,
      channelType: channelType || null,
      channelId: channelId || null,
      message: message || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
