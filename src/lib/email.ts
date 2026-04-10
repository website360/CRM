import nodemailer from 'nodemailer';
import { getSetting } from '@/lib/settings';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = await getSetting('SMTP_HOST');
    const port = await getSetting('SMTP_PORT');
    const user = await getSetting('SMTP_USER');
    const pass = await getSetting('SMTP_PASS');
    let from = await getSetting('SMTP_FROM');

    if (!host || !user || !pass) {
      console.error('[Email] SMTP not configured - host:', !!host, 'user:', !!user, 'pass:', !!pass);
      return false;
    }

    // Ensure from has email format
    if (from && !from.includes('@') && !from.includes('<')) {
      from = `${from} <${user}>`;
    }
    if (!from) from = user;

    console.log(`[Email] Sending to ${to} | Subject: ${subject} | Host: ${host}:${port} | From: ${from}`);

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587'),
      secure: port === '465',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const result = await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] Sent OK: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Send error:', error);
    return false;
  }
}

export async function testEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const success = await sendEmail(to, 'Teste de Email - CRM LP', `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #465FFF;">Email de Teste</h2>
        <p>Se você recebeu este email, a configuração SMTP está funcionando corretamente.</p>
        <p style="color: #667085; font-size: 12px;">Enviado pelo CRM LP</p>
      </div>
    `);
    return { ok: success, error: success ? undefined : 'Falha no envio - verifique os logs' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
