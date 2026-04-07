import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Webhook verification (Meta requires this)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'crm-lp-instagram-verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Instagram] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Receive messages from Instagram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== 'instagram') {
      return NextResponse.json({ ok: true });
    }

    for (const entry of body.entry || []) {
      const pageId = entry.id;

      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const message = event.message;

        if (!senderId || !message || senderId === pageId) continue;

        // Find the Instagram channel for this page
        const channels = await prisma.channel.findMany({
          where: { type: 'instagram', status: 'connected' },
        });

        // Match channel by page ID in config
        const channel = channels.find((ch) => {
          const config = ch.config as Record<string, string> | null;
          return config?.pageId === pageId || config?.igUserId === pageId;
        });

        if (!channel) {
          console.log(`[Instagram] No channel found for page ${pageId}`);
          continue;
        }

        const text = message.text || '';
        if (!text) continue;

        // Get sender profile
        let senderName = senderId;
        const config = channel.config as Record<string, string> | null;
        if (config?.accessToken) {
          try {
            const profileRes = await fetch(
              `https://graph.instagram.com/v21.0/${senderId}?fields=name,username,profile_pic&access_token=${config.accessToken}`
            );
            if (profileRes.ok) {
              const profile = await profileRes.json();
              senderName = profile.name || profile.username || senderId;

              // Update or create conversation with avatar
              const existing = await prisma.conversation.findUnique({
                where: { channelId_contactId: { channelId: channel.id, contactId: senderId } },
              });
              if (existing && !existing.contactAvatar && profile.profile_pic) {
                await prisma.conversation.update({
                  where: { id: existing.id },
                  data: { contactAvatar: profile.profile_pic },
                });
              }
            }
          } catch {}
        }

        // Get or create conversation
        let conversation = await prisma.conversation.findUnique({
          where: { channelId_contactId: { channelId: channel.id, contactId: senderId } },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              channelId: channel.id,
              contactId: senderId,
              contactName: senderName,
              mode: channel.aiEnabled ? 'ai' : 'human',
              status: 'open',
            },
          });
        }

        // Save message
        await prisma.message.create({
          data: { conversationId: conversation.id, sender: 'contact', content: text },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date(), unread: { increment: 1 }, contactName: senderName },
        });

        // Auto-reply if AI is enabled and mode is 'ai'
        if (channel.aiEnabled && conversation.mode === 'ai' && config?.accessToken) {
          // TODO: integrate with AI agent for Instagram
          // For now, send welcome message on first contact
          const msgCount = await prisma.message.count({
            where: { conversationId: conversation.id, sender: 'contact' },
          });
          if (msgCount === 1 && channel.welcomeMessage) {
            await sendInstagramMessage(config.accessToken, senderId, channel.welcomeMessage, conversation.id);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Instagram] Webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Meta
  }
}

async function sendInstagramMessage(accessToken: string, recipientId: string, text: string, conversationId: number) {
  try {
    await fetch('https://graph.instagram.com/v21.0/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    await prisma.message.create({
      data: { conversationId, sender: 'ai', content: text },
    });
  } catch (error) {
    console.error('[Instagram] Send message error:', error);
  }
}
