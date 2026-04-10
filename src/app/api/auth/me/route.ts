import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let org = null;
  if (user.orgId) {
    try {
      org = await prisma.organization.findUnique({
        where: { id: user.orgId },
        include: { plan: true, _count: { select: { users: true, leads: true, channels: true } } },
      });
    } catch {}
  }

  return NextResponse.json({ user, org });
}
