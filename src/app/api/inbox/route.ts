import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const orgId = getOrgIdFromRequest(request);
  const channelId = request.nextUrl.searchParams.get('channelId');
  const channelType = request.nextUrl.searchParams.get('type');
  const status = request.nextUrl.searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (channelId) where.channelId = parseInt(channelId);
  if (channelType) where.channel = { type: channelType, ...(orgId ? { orgId } : {}) };
  else if (orgId) where.channel = { orgId };
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
