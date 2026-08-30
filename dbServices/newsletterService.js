import { nanoid } from 'nanoid';
import fs from 'fs';
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';
import { sendMail, sendBatchMail } from '../services/mailService.js';

function readDataFromFile() {
  return JSON.parse(fs.readFileSync('data/newsletter.json', 'utf8'));
}

function saveToFile(data) {
  fs.writeFileSync('data/newsletter.json', JSON.stringify(data, null, 2));
}

function readCampaigns() {
  const path = 'data/newsletter_campaigns.json';
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ campaigns: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveCampaigns(data) {
  fs.writeFileSync('data/newsletter_campaigns.json', JSON.stringify(data, null, 2));
}

function newsletterSanityCheck(user) {
  return (user.name || user.username) && user.mail;
}

function isSubscriberVerified(n) {
  // Anciens abonnés sans champ verified = déjà actifs
  if (n.verified === undefined || n.verified === null) return true;
  return n.verified === true;
}

const newsletterService = {
  addNewsletter: async function addNewsletter(user) {
    if (!newsletterSanityCheck(user)) {
      return { code: 400, message: 'Invalid data', newsletter: null };
    }
    const rawData = config.usePostgres ? null : await readDataFromFile();
    const verifiedCount = config.usePostgres
      ? await repos.newsletter.countVerified()
      : rawData.newsletter.filter(isSubscriberVerified).length;
    if (verifiedCount >= config.newsletterMaxSubscribers) {
      return { code: 403, message: 'Limite de 500 abonnés atteinte', newsletter: null };
    }
    const existing = config.usePostgres
      ? await repos.newsletter.byMail(user.mail)
      : rawData.newsletter.find((n) => n.mail === user.mail);
    if (existing) {
      return { code: 409, message: 'Email déjà inscrit', newsletter: null };
    }
    const token = nanoid(32);
    const userToAdd = {
      id: nanoid(),
      name: user.name || user.username,
      mail: user.mail,
      verified: false,
      token,
      subscribed_at: new Date().toISOString(),
    };
    if (config.usePostgres) {
      await repos.newsletter.insertSubscriber(userToAdd);
    } else {
      rawData.newsletter.push(userToAdd);
      saveToFile(rawData);
    }

    const confirmUrl = `${config.siteUrl}/newsletter?confirm=${token}`;
    await sendMail({
      to: user.mail,
      subject: "Confirmez votre inscription à la newsletter L'Agrafe",
      html: `<p>Bonjour ${userToAdd.name},</p><p>Cliquez pour confirmer : <a href="${confirmUrl}">${confirmUrl}</a></p>`,
      text: `Confirmez votre inscription : ${confirmUrl}`,
    });

    return { code: 200, message: 'Email de confirmation envoyé', newsletter: { mail: userToAdd.mail, id: userToAdd.id } };
  },

  confirmSubscription: async function confirmSubscription(token) {
    if (config.usePostgres) {
      const sub = await repos.newsletter.byToken(token);
      if (!sub) return { code: 404, message: 'Token invalide' };
      await repos.newsletter.verify(sub.id);
      return { code: 200, message: 'Inscription confirmée' };
    }
    const rawData = await readDataFromFile();
    const sub = rawData.newsletter.find((n) => n.token === token);
    if (!sub) return { code: 404, message: 'Token invalide' };
    sub.verified = true;
    sub.token = null;
    saveToFile(rawData);
    return { code: 200, message: 'Inscription confirmée' };
  },

  /** Confirmation manuelle par un admin */
  verifySubscriber: async function verifySubscriber(id) {
    if (config.usePostgres) {
      const sub = await repos.newsletter.byId(id);
      if (!sub) return { code: 404, message: 'Abonné introuvable' };
      await repos.newsletter.verify(id);
      return { code: 200, message: 'Abonné confirmé', subscriber: { ...sub, verified: true, token: null } };
    }
    const rawData = await readDataFromFile();
    const sub = rawData.newsletter.find((n) => n.id === id);
    if (!sub) return { code: 404, message: 'Abonné introuvable' };
    sub.verified = true;
    sub.token = null;
    saveToFile(rawData);
    return { code: 200, message: 'Abonné confirmé', subscriber: sub };
  },

  deleteNewsletter: async function deleteNewsletter(mail) {
    if (config.usePostgres) {
      if (await repos.newsletter.removeByMailOrId(mail)) return { code: 200, message: 'mail deleted' };
      return { code: 406, message: 'mail not found' };
    }
    const rawData = await readDataFromFile();
    const index = rawData.newsletter.findIndex((user) => mail === user.mail || mail === user.id);
    if (index !== -1) {
      rawData.newsletter.splice(index, 1);
      saveToFile(rawData);
      return { code: 200, message: 'mail deleted' };
    }
    return { code: 406, message: 'mail not found' };
  },

  getAllNewsletter: async function getAllNewsletter() {
    if (config.usePostgres) {
      const newsletter = (await repos.newsletter.allSubscribers()).map((n) => ({
        ...n,
        pending: n.verified === false,
      }));
      return { code: 200, message: 'Newsletters', newsletter };
    }
    const rawData = await readDataFromFile();
    const newsletter = rawData.newsletter.map((n) => ({
      ...n,
      verified: isSubscriberVerified(n),
      pending: n.verified === false,
    }));
    return { code: 200, message: 'Newsletters', newsletter };
  },

  getVerifiedSubscribers: async function getVerifiedSubscribers() {
    if (config.usePostgres) return repos.newsletter.verifiedMails();
    const rawData = await readDataFromFile();
    return rawData.newsletter.filter(isSubscriberVerified).map((n) => n.mail).filter(Boolean);
  },

  createCampaign: async function createCampaign({ subject, html_body, created_by }) {
    if (config.usePostgres) {
      const campaign = {
        id: nanoid(), subject, html_body, sent_at: null, recipient_count: 0, created_by,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      await repos.newsletter.insertCampaign(campaign);
      return { code: 200, campaign };
    }
    const campaigns = readCampaigns();
    const campaign = {
      id: nanoid(),
      subject,
      html_body,
      sent_at: null,
      recipient_count: 0,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    campaigns.campaigns.push(campaign);
    saveCampaigns(campaigns);
    return { code: 200, campaign };
  },

  updateCampaign: async function updateCampaign(id, { subject, html_body }) {
    if (config.usePostgres) {
      const campaign = await repos.newsletter.campaignById(id);
      if (!campaign) return { code: 404, message: 'Campaign not found' };
      if (campaign.sent_at) return { code: 400, message: 'Campagne déjà envoyée, non modifiable' };
      await repos.newsletter.updateCampaign(id, { subject, html_body });
      return { code: 200, campaign: { ...campaign, ...(subject !== undefined && { subject }), ...(html_body !== undefined && { html_body }), updated_at: new Date().toISOString() } };
    }
    const campaigns = readCampaigns();
    const campaign = campaigns.campaigns.find((c) => c.id === id);
    if (!campaign) return { code: 404, message: 'Campaign not found' };
    if (campaign.sent_at) return { code: 400, message: 'Campagne déjà envoyée, non modifiable' };
    if (subject !== undefined) campaign.subject = subject;
    if (html_body !== undefined) campaign.html_body = html_body;
    campaign.updated_at = new Date().toISOString();
    saveCampaigns(campaigns);
    return { code: 200, campaign };
  },

  sendCampaign: async function sendCampaign(campaignId) {
    const campaigns = config.usePostgres ? null : readCampaigns();
    const campaign = config.usePostgres
      ? await repos.newsletter.campaignById(campaignId)
      : campaigns.campaigns.find((c) => c.id === campaignId);
    if (!campaign) return { code: 404, message: 'Campaign not found' };
    if (campaign.sent_at) return { code: 400, message: 'Campagne déjà envoyée' };
    const recipients = await this.getVerifiedSubscribers();
    if (recipients.length === 0) {
      return {
        code: 400,
        message: 'Aucun abonné confirmé. Les inscriptions non confirmées ne reçoivent pas les envois.',
        results: { sent: 0, failed: 0, recipients: 0 },
      };
    }
    if (recipients.length > config.newsletterMaxSubscribers) {
      return { code: 403, message: 'Trop de destinataires' };
    }
    const results = await sendBatchMail(recipients, campaign.subject, campaign.html_body);
    results.recipients = recipients.length;
    if (results.skippedSmtp) {
      return {
        code: 503,
        message: 'SMTP non configuré dans .env — aucun email envoyé',
        results,
        campaign,
      };
    }
    campaign.sent_at = new Date().toISOString();
    campaign.recipient_count = results.sent;
    if (config.usePostgres) {
      await repos.newsletter.markCampaignSent(campaignId, results.sent);
    } else {
      saveCampaigns(campaigns);
    }
    return { code: 200, results, campaign };
  },

  getCampaigns: async function getCampaigns() {
    if (config.usePostgres) return { code: 200, campaigns: await repos.newsletter.allCampaigns() };
    return { code: 200, campaigns: readCampaigns().campaigns };
  },

  getCampaign: async function getCampaign(id) {
    if (config.usePostgres) {
      const campaign = await repos.newsletter.campaignById(id);
      if (!campaign) return { code: 404, message: 'Not found' };
      return { code: 200, campaign };
    }
    const campaign = readCampaigns().campaigns.find((c) => c.id === id);
    if (!campaign) return { code: 404, message: 'Not found' };
    return { code: 200, campaign };
  },
};

export default newsletterService;
