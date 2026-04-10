import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { name, email, password, companyName } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
  }

  // Create organization
  const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50);
  const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  // Get free plan
  let freePlan = await prisma.plan.findFirst({ where: { price: 0, active: true } });
  if (!freePlan) {
    freePlan = await prisma.plan.create({
      data: { name: 'Gratuito', maxUsers: 1, maxChannels: 1, maxLeads: 100, price: 0, features: { whatsapp: true, email: false, automation: false, crm: true } },
    });
  }

  const org = await prisma.organization.create({
    data: {
      name: companyName || `Empresa de ${name}`,
      slug: uniqueSlug,
      planId: freePlan.id,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    },
  });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword, role: 'owner', orgId: org.id },
  });

  const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId, avatar: null });

  const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  response.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
  return response;
}
