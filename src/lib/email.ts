import nodemailer from 'nodemailer';
import { getSetting } from '@/lib/settings';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = await getSetting('SMTP_HOST');
    const port = await getSetting('SMTP_PORT');
    const user = await getSetting('SMTP_USER');
    const pass = await getSetting('SMTP_PASS');
    const from = await getSetting('SMTP_FROM') || user;

    if (!host || !user || !pass) {
      console.error('[Email] SMTP not configured');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587'),
      secure: port === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({ from, to, subject, html });
    return true;
  } catch (error) {
    console.error('[Email] Send error:', error);
    return false;
  }
}
