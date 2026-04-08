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
    const instanceId = config.instanceId;
    const token = config.token;
    await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, message: text }),
    });
  } else if (provider === 'evolution') {
    const serverUrl = config.serverUrl.replace(/\/$/, '');
    await fetch(`${serverUrl}/message/sendText/${config.instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.apiKey },
      body: JSON.stringify({ number: to, text }),
    });
  }
}
