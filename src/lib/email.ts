import nodemailer from 'nodemailer';
import { getSetting } from '@/lib/settings';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try API provider first
  const apiKey = await getSetting('EMAIL_API_KEY');
  const apiProvider = await getSetting('EMAIL_API_PROVIDER');
  if (apiKey) return sendViaAPI(apiProvider || 'resend', apiKey, to, subject, html);

  // SMTP
  return sendViaSMTP(to, subject, html);
}

async function sendViaAPI(provider: string, apiKey: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const fromEmail = await getSetting('SMTP_FROM') || await getSetting('SMTP_USER') || 'noreply@crm.com';
    const fromName = await getSetting('EMAIL_FROM_NAME') || 'CRM';
    const emailMatch = fromEmail.match(/<(.+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : fromEmail.includes('@') ? fromEmail : 'noreply@crm.com';
    const senderName = emailMatch ? fromEmail.replace(/<.+>/, '').trim() : fromName;

    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ from: `${senderName} <${senderEmail}>`, to, subject, html }),
      });
      if (res.ok) { console.log(`[Email] Resend OK → ${to}`); return true; }
      console.error(`[Email] Resend error:`, await res.text());
      return false;
    }
    if (provider === 'brevo' || provider === 'sendinblue') {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email: to }], subject, htmlContent: html }),
      });
      if (res.ok) { console.log(`[Email] Brevo OK → ${to}`); return true; }
      console.error(`[Email] Brevo error:`, await res.text());
      return false;
    }
    if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: senderEmail, name: senderName }, subject, content: [{ type: 'text/html', value: html }] }),
      });
      if (res.ok || res.status === 202) { console.log(`[Email] SendGrid OK → ${to}`); return true; }
      console.error(`[Email] SendGrid error:`, await res.text());
      return false;
    }
    console.error(`[Email] Unknown provider: ${provider}`);
    return false;
  } catch (e) { console.error('[Email] API error:', e); return false; }
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  const host = await getSetting('SMTP_HOST');
  const portSetting = await getSetting('SMTP_PORT');
  const user = await getSetting('SMTP_USER');
  const pass = await getSetting('SMTP_PASS');
  let from = await getSetting('SMTP_FROM');

  if (!host || !user || !pass) { console.error('[Email] SMTP not configured'); return false; }
  if (from && !from.includes('@') && !from.includes('<')) from = `${from} <${user}>`;
  if (!from) from = user;

  // Try configured port first, then fallback to 25 (often not blocked)
  const portsToTry = [parseInt(portSetting || '587'), 25, 2525].filter((v, i, a) => a.indexOf(v) === i);

  for (const port of portsToTry) {
    try {
      console.log(`[Email] Trying ${host}:${port} → ${to}`);
      const transporter = nodemailer.createTransport({
        host, port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
      });

      const result = await transporter.sendMail({ from, to, subject, html });
      console.log(`[Email] Sent via ${host}:${port} - ${result.messageId}`);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[Email] Port ${port} failed: ${msg.slice(0, 80)}`);
    }
  }

  console.error(`[Email] All ports failed for ${host}`);
  return false;
}

export async function testEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ok = await sendEmail(to, 'Teste de Email - CRM LP', `
      <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;margin:0 auto;">
        <h2 style="color:#465FFF;">✓ Email de Teste</h2>
        <p>A configuração de email está funcionando!</p>
        <p style="color:#667085;font-size:12px;margin-top:20px;">Enviado pelo CRM LP</p>
      </div>`);
    return { ok, error: ok ? undefined : 'Falha - verifique logs do servidor (pm2 logs crm-lp)' };
  } catch (e) { return { ok: false, error: String(e) }; }
}
