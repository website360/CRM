import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });

  // Seed default plans if none exist
  if (plans.length === 0) {
    await prisma.plan.createMany({
      data: [
        { name: 'Gratuito', maxUsers: 1, maxChannels: 1, maxLeads: 100, price: 0, features: { whatsapp: true, email: false, automation: false, crm: true } },
        { name: 'Starter', maxUsers: 3, maxChannels: 3, maxLeads: 1000, price: 97, features: { whatsapp: true, email: true, automation: false, crm: true } },
        { name: 'Pro', maxUsers: 10, maxChannels: 10, maxLeads: 10000, price: 197, features: { whatsapp: true, email: true, automation: true, crm: true } },
        { name: 'Enterprise', maxUsers: 999, maxChannels: 999, maxLeads: 999999, price: 497, features: { whatsapp: true, email: true, automation: true, crm: true } },
      ],
    });
    plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
  }

  return NextResponse.json(plans);
}
