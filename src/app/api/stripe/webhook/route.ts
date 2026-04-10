import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { getSetting } from '@/lib/settings';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const stripe = await getStripe();
  const webhookSecret = await getSetting('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error('[Stripe] Webhook signature error:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe] Event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orgId = parseInt(session.metadata?.orgId || '0');
      const planId = parseInt(session.metadata?.planId || '0');
      const subscriptionId = session.subscription as string;

      if (orgId && planId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: { planId, stripeSubscriptionId: subscriptionId, trialEndsAt: null },
        });
        console.log(`[Stripe] Org ${orgId} upgraded to plan ${planId}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const orgId = parseInt(sub.metadata?.orgId || '0');
      if (orgId && sub.status === 'active') {
        console.log(`[Stripe] Subscription active for org ${orgId}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const orgId = parseInt(sub.metadata?.orgId || '0');
      if (orgId) {
        // Downgrade to free plan
        const freePlan = await prisma.plan.findFirst({ where: { price: 0, active: true } });
        if (freePlan) {
          await prisma.organization.update({
            where: { id: orgId },
            data: { planId: freePlan.id, stripeSubscriptionId: null },
          });
          console.log(`[Stripe] Org ${orgId} downgraded to free`);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`[Stripe] Payment failed for customer ${invoice.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
