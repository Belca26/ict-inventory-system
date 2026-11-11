import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const t = getTransporter();

  if (!t) {
    // No SMTP configured (typical in local dev) — log instead of failing silently.
    console.log(`[email:not-sent — SMTP not configured] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  try {
    await t.sendMail({ from: env.SMTP_FROM, to, subject, text });
  } catch (err) {
    // Email failures must never break the calling business operation
    // (e.g. an asset status change) — log and move on.
    console.error(`Failed to send email to ${to}:`, err);
  }
}
