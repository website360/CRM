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

    // Get leads matching audience
    const filters = (campaign.audience.filters || {}) as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (filters.sources && Array.isArray(filters.sources) && filters.sources.length > 0) where.source = { in: filters.sources };
    if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) where.status = { in: filters.statuses };

    const leads = await prisma.lead.findMany({ where, select: { id: true, phone: true, name: true } });

    // Get channel for sending
    if (campaign.channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: campaign.channelId } });
      if (channel && campaign.message) {
        const config = channel.config as Record<string, string>;
        let sentCount = 0;

        for (const lead of leads) {
          if (!lead.phone) continue;
          try {
            const personalMsg = campaign.message
              .replace(/\{nome\}/gi, lead.name || '')
              .replace(/\{telefone\}/gi, lead.phone || '');

            await sendWhatsAppMessage(config, lead.phone, personalMsg);
            await prisma.campaignAction.create({
              data: { campaignId: campaign.id, leadId: lead.id, action: 'sent' },
            });
            sentCount++;
          } catch (e) {
            console.error(`[Campaign] Failed to send to ${lead.phone}:`, e);
          }
        }

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'completed', sentCount: { increment: sentCount } },
        });

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
