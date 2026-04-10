import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
  if (!org?.stripeCustomerId) return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 });

  const stripe = await getStripe();
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${proto}://${host}/planos`,
  });

  return NextResponse.json({ url: session.url });
}
