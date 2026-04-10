import nodemailer from 'nodemailer';
import { getSetting } from '@/lib/settings';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try API-based provider first (bypasses SMTP port blocks)
  const apiKey = await getSetting('EMAIL_API_KEY');
  const apiProvider = await getSetting('EMAIL_API_PROVIDER');

  if (apiKey) {
    return sendViaAPI(apiProvider || 'brevo', apiKey, to, subject, html);
  }

  // Fallback to SMTP
  return sendViaSMTP(to, subject, html);
}

async function sendViaAPI(provider: string, apiKey: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const fromEmail = await getSetting('SMTP_FROM') || await getSetting('SMTP_USER') || 'noreply@crm.com';
    const fromName = await getSetting('EMAIL_FROM_NAME') || 'CRM';

    // Extract email from "Name <email>" format
    const emailMatch = fromEmail.match(/<(.+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : fromEmail.includes('@') ? fromEmail : 'noreply@crm.com';
    const senderName = emailMatch ? fromEmail.replace(/<.+>/, '').trim() : fromName;

    if (provider === 'brevo' || provider === 'sendinblue') {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (res.ok) { console.log(`[Email] Sent via Brevo to ${to}`); return true; }
      const err = await res.text();
      console.error(`[Email] Brevo error: ${err}`);
      return false;
    }

    if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: senderEmail, name: senderName },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (res.ok || res.status === 202) { console.log(`[Email] Sent via SendGrid to ${to}`); return true; }
      const err = await res.text();
      console.error(`[Email] SendGrid error: ${err}`);
      return false;
    }

    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ from: `${senderName} <${senderEmail}>`, to, subject, html }),
      });
      if (res.ok) { console.log(`[Email] Sent via Resend to ${to}`); return true; }
      const err = await res.text();
      console.error(`[Email] Resend error: ${err}`);
      return false;
    }

    console.error(`[Email] Unknown provider: ${provider}`);
    return false;
  } catch (error) {
    console.error('[Email] API error:', error);
    return false;
  }
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = await getSetting('SMTP_HOST');
    const port = await getSetting('SMTP_PORT');
    const user = await getSetting('SMTP_USER');
    const pass = await getSetting('SMTP_PASS');
    let from = await getSetting('SMTP_FROM');

    if (!host || !user || !pass) {
      console.error('[Email] SMTP not configured');
      return false;
    }

    if (from && !from.includes('@') && !from.includes('<')) from = `${from} <${user}>`;
    if (!from) from = user;

    console.log(`[Email] SMTP sending to ${to} via ${host}:${port}`);

    const transporter = nodemailer.createTransport({
      host, port: parseInt(port || '587'),
      secure: port === '465',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });

    const result = await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] SMTP sent: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] SMTP error:', error);
    return false;
  }
}

export async function testEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const success = await sendEmail(to, 'Teste de Email - CRM LP', `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #465FFF;">✓ Email de Teste</h2>
        <p>A configuração de email está funcionando corretamente!</p>
        <p style="color: #667085; font-size: 12px; margin-top: 20px;">Enviado pelo CRM LP</p>
      </div>
    `);
    return { ok: success, error: success ? undefined : 'Falha no envio - verifique os logs do servidor' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
