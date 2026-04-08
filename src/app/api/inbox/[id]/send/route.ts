import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendWhatsAppImage } from '@/lib/whatsapp/send';
import { getSetting } from '@/lib/settings';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { text, mediaUrl, mediaType } = await request.json();
  if (!text && !mediaUrl) return NextResponse.json({ error: 'Texto ou mídia obrigatório' }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: parseInt(id) },
    include: { channel: true },
  });
  if (!conversation) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  const config = conversation.channel.config as Record<string, string> | null;

  // Get signature if enabled
  const signatureEnabled = config?.signatureEnabled === 'true';
  const signature = config?.signature || '';
  const finalText = text && signatureEnabled && signature ? `${text}\n\n${signature}` : text;

  // Send via channel
  if (conversation.channel.type === 'whatsapp' && config) {
    if (mediaUrl && mediaType === 'image') {
      await sendWhatsAppImage(config, conversation.contactId, mediaUrl, finalText || undefined);
    } else if (finalText) {
      await sendWhatsAppMessage(config, conversation.contactId, finalText);
    }
  } else if (conversation.channel.type === 'instagram' && config?.accessToken) {
    if (finalText) {
      await fetch('https://graph.instagram.com/v21.0/me/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.accessToken}` },
        body: JSON.stringify({ recipient: { id: conversation.contactId }, message: { text: finalText } }),
      });
    }
  }

  const content = mediaUrl ? `[imagem: ${mediaUrl}]` : (finalText || text);
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'human',
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
    },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  return NextResponse.json(message, { status: 201 });
}
