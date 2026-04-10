import { NextRequest, NextResponse } from 'next/server';
import { testEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { to } = await request.json();
  if (!to) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });

  const result = await testEmail(to);
  return NextResponse.json(result);
}
