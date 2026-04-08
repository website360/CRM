import { getSetting } from '@/lib/settings';

export async function sendWhatsAppMessage(
  config: Record<string, string>,
  to: string,
  text: string,
): Promise<void> {
  const provider = config.provider || 'meta';

  if (provider === 'meta') {
    await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
  } else if (provider === 'zapi') {
    await fetch(`https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, message: text }),
    });
  } else if (provider === 'evolution') {
    const serverUrl = ((await getSetting('EVOLUTION_API_URL')) || '').replace(/\/$/, '');
    const apiKey = (await getSetting('EVOLUTION_API_KEY')) || '';
    await fetch(`${serverUrl}/message/sendText/${config.instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: to, text }),
    });
  }
}

export async function sendWhatsAppImage(
  config: Record<string, string>,
  to: string,
  imageUrl: string,
  caption?: string,
): Promise<void> {
  const provider = config.provider || 'meta';

  if (provider === 'meta') {
    await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'image', image: { link: imageUrl, caption } }),
    });
  } else if (provider === 'zapi') {
    await fetch(`https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, image: imageUrl, caption }),
    });
  } else if (provider === 'evolution') {
    const serverUrl = ((await getSetting('EVOLUTION_API_URL')) || '').replace(/\/$/, '');
    const apiKey = (await getSetting('EVOLUTION_API_KEY')) || '';
    await fetch(`${serverUrl}/message/sendMedia/${config.instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: to, mediatype: 'image', media: imageUrl, caption }),
    });
  }
}
