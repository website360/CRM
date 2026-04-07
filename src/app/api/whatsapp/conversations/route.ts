import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List conversations (optionally filter by instance)
export async function GET(request: NextRequest) {
  const instanceId = request.nextUrl.searchParams.get('instanceId');

  const conversations = await prisma.conversation.findMany({
    where: instanceId ? { instanceId: parseInt(instanceId) } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      instance: { select: { name: true, phone: true } },
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}
