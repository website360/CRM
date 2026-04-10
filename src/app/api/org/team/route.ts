import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const team = await prisma.user.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true, email: true, role: true, avatar: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(team);
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser?.orgId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (authUser.role !== 'owner' && authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // Check plan limits
  const org = await prisma.organization.findUnique({ where: { id: authUser.orgId }, include: { plan: true } });
  if (org?.plan) {
    const currentCount = await prisma.user.count({ where: { orgId: authUser.orgId } });
    if (currentCount >= org.plan.maxUsers) {
      return NextResponse.json({ error: `Limite de ${org.plan.maxUsers} usuários atingido. Faça upgrade do plano.` }, { status: 403 });
    }
  }

  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ error: 'Nome, email e senha obrigatórios' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password), role: role || 'member', orgId: authUser.orgId },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser?.orgId || (authUser.role !== 'owner' && authUser.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { userId } = await request.json();
  if (userId === authUser.id) return NextResponse.json({ error: 'Não pode remover a si mesmo' }, { status: 400 });

  await prisma.user.delete({ where: { id: userId, orgId: authUser.orgId } });
  return NextResponse.json({ ok: true });
}
