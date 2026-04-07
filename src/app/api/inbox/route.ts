import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get('channelId');
  const channelType = request.nextUrl.searchParams.get('type');
  const status = request.nextUrl.searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (channelId) where.channelId = parseInt(channelId);
  if (channelType) where.channel = { type: channelType };
  if (status) where.status = status;

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      channel: { select: { name: true, type: true, config: true } },
      messages: { orderBy: { timestamp: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}
