/**
 * Layout HTML email — même identité visuelle que les templates admin (annonce).
 * Styles inline, polices web-safe.
 */

import { config } from '../config/env.js';

const CONTACT = 'lagrafejournal@protonmail.com';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteUrl() {
  return (config.siteUrl || 'https://lagrafejournal.com').replace(/\/$/, '');
}

function ctaButton(url, label) {
  if (!url || !label) return '';
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td style="background:#111111;border-radius:2px;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-family:Georgia,Times,serif;font-size:15px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

function wrapLayout({
  preheader = '',
  title = '',
  bodyHtml = '',
  extraHtml = '',
  footerNote = "Vous recevez ce message car vous êtes abonné·e à la newsletter de L'Agrafe.",
}) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const base = siteUrl();
  const displayHost = base.replace(/^https?:\/\//, '');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e2e2;">
          <tr>
            <td style="padding:28px 28px 12px;border-bottom:3px solid #111111;">
              <p style="margin:0;font-family:Georgia,Times,serif;font-size:22px;letter-spacing:0.02em;color:#111111;">L'Agrafe</p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.08em;">Journal étudiant · Rennes 2</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
              ${title ? `<h1 style="margin:0 0 16px;font-family:Georgia,Times,serif;font-size:26px;line-height:1.25;color:#111111;font-weight:normal;">${safeTitle}</h1>` : ''}
              ${bodyHtml}
              ${extraHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;border-top:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#888888;">
              <p style="margin:0 0 6px;">${escapeHtml(footerNote)}</p>
              <p style="margin:0;">
                <a href="${escapeHtml(base)}" style="color:#111111;">${escapeHtml(displayHost)}</a>
                ·
                <a href="mailto:${CONTACT}" style="color:#111111;">${CONTACT}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Mail de confirmation d'inscription (double opt-in). */
export function buildConfirmSubscriptionEmail({ name, confirmUrl }) {
  const safeName = escapeHtml(name || '');
  const greeting = safeName ? `Bonjour ${safeName},` : 'Bonjour,';
  const bodyHtml = `
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">${greeting}</p>
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">
      Merci de votre intérêt pour L'Agrafe. Pour finaliser votre inscription à la newsletter, confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.
    </p>
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.
    </p>`;

  return {
    subject: "Confirmez votre inscription à la newsletter L'Agrafe",
    html: wrapLayout({
      preheader: 'Confirmez votre adresse pour rejoindre la newsletter de L\'Agrafe.',
      title: 'Confirmez votre inscription',
      bodyHtml,
      extraHtml: ctaButton(confirmUrl, 'Confirmer mon inscription'),
      footerNote: "Vous recevez ce message suite à une demande d'inscription à la newsletter de L'Agrafe.",
    }),
    text: `${name ? `Bonjour ${name},` : 'Bonjour,'}\n\nConfirmez votre inscription à la newsletter L'Agrafe :\n${confirmUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
  };
}

/** Mail de bienvenue après confirmation d'inscription. */
export function buildWelcomeEmail({ name }) {
  const safeName = escapeHtml(name || '');
  const greeting = safeName ? `Bonjour ${safeName},` : 'Bonjour,';
  const homeUrl = siteUrl();
  const bodyHtml = `
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">${greeting}</p>
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">
      Votre inscription à la newsletter de L'Agrafe est confirmée. Bienvenue !
    </p>
    <p style="margin:0 0 1em;line-height:1.6;color:#222;font-size:16px;">
      Vous recevrez désormais nos actualités : nouvelles parutions, événements et appels à contribution. En attendant, retrouvez nos articles sur le site.
    </p>`;

  return {
    subject: "Bienvenue dans la newsletter de L'Agrafe",
    html: wrapLayout({
      preheader: 'Votre inscription est confirmée — bienvenue chez L\'Agrafe.',
      title: 'Bienvenue !',
      bodyHtml,
      extraHtml: ctaButton(homeUrl, 'Découvrir le site'),
      footerNote: "Vous recevez ce message car vous êtes abonné·e à la newsletter de L'Agrafe.",
    }),
    text: `${name ? `Bonjour ${name},` : 'Bonjour,'}\n\nVotre inscription à la newsletter de L'Agrafe est confirmée. Bienvenue !\n\nRetrouvez nos articles : ${homeUrl}`,
  };
}
