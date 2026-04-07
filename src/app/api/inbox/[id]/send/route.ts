import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waManager } from '@/lib/whatsapp/manager';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { text } = await request.json();
  if (!text) return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: parseInt(id) },
    include: { channel: true },
  });
  if (!conversation) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  // Send via the appropriate channel
  if (conversation.channel.type === 'whatsapp') {
    await waManager.sendMessage(conversation.channelId, conversation.contactId, text);
  } else if (conversation.channel.type === 'instagram') {
    // Send via Instagram Graph API
    const config = conversation.channel.config as Record<string, string> | null;
    if (config?.accessToken) {
      await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.accessToken}` },
        body: JSON.stringify({ recipient: { id: conversation.contactId }, message: { text } }),
      });
    }
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, sender: 'human', content: text },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  return NextResponse.json(message, { status: 201 });
}
