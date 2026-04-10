import { NextResponse } from 'next/server';
import { getAuthUser, getAuthOrg } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const org = await getAuthOrg();
  return NextResponse.json({ user, org });
}
