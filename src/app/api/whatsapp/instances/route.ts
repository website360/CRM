import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waManager } from '@/lib/whatsapp/manager';

// GET - List all instances
export async function GET() {
  const instances = await prisma.whatsAppInstance.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { conversations: true } },
    },
  });
  return NextResponse.json(instances);
}

// POST - Create new instance
export async function POST(request: NextRequest) {
  const { name, welcomeMessage, aiEnabled, aiPrompt } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const instance = await prisma.whatsAppInstance.create({
    data: {
      name,
      welcomeMessage: welcomeMessage || null,
      aiEnabled: aiEnabled || false,
      aiPrompt: aiPrompt || null,
    },
  });

  return NextResponse.json(instance, { status: 201 });
}
