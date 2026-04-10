import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const defaultPlans = [
  { name: 'Gratuito', maxUsers: 1, maxChannels: 1, maxLeads: 100, price: 0, priceYearly: 0, features: { whatsapp: true, instagram: false, webchat: true, email: false, automation: false, crm: true, ai: false, api: true } },
  { name: 'Starter', maxUsers: 3, maxChannels: 3, maxLeads: 1000, price: 97, priceYearly: 970, features: { whatsapp: true, instagram: true, webchat: true, email: true, automation: false, crm: true, ai: false, api: true } },
  { name: 'Pro', maxUsers: 10, maxChannels: 10, maxLeads: 10000, price: 197, priceYearly: 1970, features: { whatsapp: true, instagram: true, webchat: true, email: true, automation: true, crm: true, ai: true, api: true } },
  { name: 'Enterprise', maxUsers: 999, maxChannels: 999, maxLeads: 999999, price: 497, priceYearly: 4970, features: { whatsapp: true, instagram: true, webchat: true, email: true, automation: true, crm: true, ai: true, api: true } },
];

export async function GET() {
  let plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });

  // Seed missing plans
  if (plans.length < defaultPlans.length) {
    const existingNames = plans.map((p) => p.name);
    const missing = defaultPlans.filter((p) => !existingNames.includes(p.name));
    if (missing.length > 0) {
      await prisma.plan.createMany({ data: missing });
      plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
    }
  }

  return NextResponse.json(plans);
}
