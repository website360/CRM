import { getSetting } from '@/lib/settings';

// Unified WhatsApp message sender for all providers

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
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
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
    const instanceName = config.instanceName || '';

    await fetch(`${serverUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: to, text }),
    });
  }
}
