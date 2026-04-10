import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { planId, interval, licenses } = await request.json();
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });

  const stripe = await getStripe();
  const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
  if (!org) return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });

  // Get or create Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { orgId: org.id.toString(), userId: user.id.toString() },
    });
    customerId = customer.id;
    await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
  }

  // Determine price
  const isYearly = interval === 'yearly';
  const priceId = isYearly ? plan.stripePriceYearlyId : plan.stripePriceId;

  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  // If there's a Stripe price ID, use it
  if (priceId) {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: licenses || 1 }],
      success_url: `${baseUrl}/planos?success=true`,
      cancel_url: `${baseUrl}/planos?canceled=true`,
      metadata: { orgId: org.id.toString(), planId: plan.id.toString() },
      subscription_data: {
        metadata: { orgId: org.id.toString(), planId: plan.id.toString() },
      },
    });
    return NextResponse.json({ url: session.url });
  }

  // Create ad-hoc price if no Stripe price ID configured
  const unitPrice = isYearly ? (plan.priceYearly || plan.price * 10) : plan.price;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: `${plan.name} - CRM LP`, description: `${plan.maxUsers} usuários, ${plan.maxChannels} canais, ${plan.maxLeads} leads` },
        unit_amount: Math.round(unitPrice * 100),
        recurring: { interval: isYearly ? 'year' : 'month' },
      },
      quantity: licenses || 1,
    }],
    success_url: `${baseUrl}/planos?success=true`,
    cancel_url: `${baseUrl}/planos?canceled=true`,
    metadata: { orgId: org.id.toString(), planId: plan.id.toString() },
    subscription_data: {
      metadata: { orgId: org.id.toString(), planId: plan.id.toString() },
    },
  });

  return NextResponse.json({ url: session.url });
}
