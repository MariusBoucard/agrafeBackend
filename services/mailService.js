import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('SMTP not configured, email not sent to', to);
    return { sent: false, reason: 'SMTP not configured' };
  }
  await transport.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text,
  });
  return { sent: true };
}

export async function sendBatchMail(recipients, subject, html) {
  const results = { sent: 0, failed: 0, skippedSmtp: false };
  const transport = getTransporter();
  if (!transport) {
    console.warn('SMTP not configured — 0 emails sent (recipients:', recipients.length, ')');
    results.skippedSmtp = true;
    results.failed = recipients.length;
    return results;
  }
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    for (const mail of batch) {
      try {
        const out = await sendMail({ to: mail, subject, html });
        if (out.sent) results.sent++;
        else results.failed++;
      } catch (e) {
        console.error('Failed to send to', mail, e.message);
        results.failed++;
      }
    }
    if (i + batchSize < recipients.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return results;
}
