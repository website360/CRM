import Stripe from 'stripe';
import { getSetting } from '@/lib/settings';

let stripeInstance: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (stripeInstance) return stripeInstance;
  const key = await getSetting('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  stripeInstance = new Stripe(key);
  return stripeInstance;
}
