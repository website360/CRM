import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Admin endpoint - protected by a secret key
export async function POST(request: NextRequest) {
  const { action, secret, ...data } = await request.json();

  // Simple secret check
  if (secret !== 'crm-admin-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'set-plan') {
    const result = await prisma.organization.updateMany({
      where: data.orgId ? { id: data.orgId } : {},
      data: { planId: data.planId, trialEndsAt: null },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  }

  if (action === 'list-orgs') {
    const orgs = await prisma.organization.findMany({
      include: { plan: { select: { name: true } }, _count: { select: { users: true } } },
    });
    return NextResponse.json(orgs);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
