import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.avatar !== undefined) data.avatar = body.avatar;

  // Password change
  if (body.newPassword) {
    if (!body.currentPassword) return NextResponse.json({ error: 'Senha atual obrigatória' }, { status: 400 });
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    const valid = await verifyPassword(body.currentPassword, fullUser.password);
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    if (body.newPassword.length < 6) return NextResponse.json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    data.password = await hashPassword(body.newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, avatar: true, role: true },
  });

  return NextResponse.json(updated);
}
