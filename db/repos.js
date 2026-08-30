import { query } from '../db.js';
import {
  mapArticle,
  mapArchive,
  mapCampaign,
  mapDossier,
  mapFocale,
  mapNews,
  mapPage,
  mapRubrique,
  mapSubscriber,
} from './mappers.js';

/* ---------- Rubriques ---------- */
export const rubriques = {
  async all() {
    const res = await query('SELECT * FROM rubriques ORDER BY rubrique');
    return res.rows.map(mapRubrique);
  },
  async byId(id) {
    const res = await query('SELECT * FROM rubriques WHERE id = $1', [id]);
    return mapRubrique(res.rows[0]);
  },
  async insert(r) {
    await query(
      `INSERT INTO rubriques (id, rubrique, description, rub_route, information, nombre_sec_min, nombre_sec_max, nombre_articles)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [r.id, r.rubrique, r.description, r.rubRoute, r.information, r.nombreSecMin ?? 0, r.nombreSecMax ?? 0, r.nombreArticles ?? 0],
    );
  },
  async update(r) {
    await query(
      `UPDATE rubriques SET rubrique=$2, description=$3, rub_route=$4, information=$5, nombre_sec_min=$6, nombre_sec_max=$7
       WHERE id=$1`,
      [r.id, r.rubrique, r.description, r.rubRoute, r.information, r.nombreSecMin, r.nombreSecMax],
    );
  },
  async remove(id) {
    const res = await query('DELETE FROM rubriques WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
  async bumpArticles(id, delta) {
    await query('UPDATE rubriques SET nombre_articles = GREATEST(COALESCE(nombre_articles,0) + $2, 0) WHERE id = $1', [id, delta]);
  },
};

/* ---------- Dossiers ---------- */
export const dossiers = {
  async all() {
    const res = await query('SELECT * FROM dossiers ORDER BY ordre, created_at DESC');
    return res.rows.map(mapDossier);
  },
  async byId(id) {
    const res = await query('SELECT * FROM dossiers WHERE id = $1', [id]);
    return mapDossier(res.rows[0]);
  },
  async insert(d) {
    await query(
      `INSERT INTO dossiers (id, titre, description, statut, rubrique_id, featured, ordre, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [d.id, d.titre, d.description || '', d.statut || 'en_cours', d.rubrique_id || null, d.featured ?? false, d.ordre ?? 0, d.created_at || new Date().toISOString()],
    );
  },
  async update(d) {
    await query(
      `UPDATE dossiers SET titre=$2, description=$3, statut=$4, rubrique_id=$5, featured=$6, ordre=$7, updated_at=NOW()
       WHERE id=$1`,
      [d.id, d.titre, d.description, d.statut, d.rubrique_id || null, d.featured ?? false, d.ordre ?? 0],
    );
  },
  async remove(id) {
    const res = await query('DELETE FROM dossiers WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
};

/* ---------- Articles ---------- */
export const articles = {
  async all() {
    const res = await query('SELECT * FROM articles ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapArticle);
  },
  async publicAll() {
    const res = await query('SELECT * FROM articles WHERE private = false ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapArticle);
  },
  async byId(id) {
    const res = await query('SELECT * FROM articles WHERE id = $1', [id]);
    return mapArticle(res.rows[0]);
  },
  async byRubrique(rubId) {
    const res = await query('SELECT * FROM articles WHERE rubrique_id = $1 ORDER BY date DESC NULLS LAST', [rubId]);
    return res.rows.map(mapArticle);
  },
  async page(number, pageSize = 5) {
    const res = await query(
      'SELECT * FROM articles ORDER BY date DESC NULLS LAST OFFSET $1 LIMIT $2',
      [number * pageSize, pageSize],
    );
    return res.rows.map(mapArticle);
  },
  async searchByTitle(name) {
    const needle = name.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    const res = await query('SELECT * FROM articles');
    return res.rows.map(mapArticle).filter((a) =>
      (a.titreFront || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').includes(needle),
    );
  },
  async recent(limit = 50) {
    const res = await query(
      'SELECT * FROM articles WHERE private = false ORDER BY date DESC NULLS LAST LIMIT $1',
      [limit],
    );
    return res.rows.map(mapArticle);
  },
  async sumLectures() {
    const res = await query('SELECT COALESCE(SUM(lectures),0)::int AS total FROM articles');
    return res.rows[0].total;
  },
  async insert(a) {
    await query(
      `INSERT INTO articles (
         id, titre_front, description, image_logo, path, auteur, numero_paru, date,
         created_at, published_at, updated_at, private, rubrique_id, dossier_id, mis_en_ligne, rang, lectures, file_type
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,$14,$15,$16,$17)`,
      [
        a.id, a.titreFront, a.description, a.imageLogo, a.path, a.auteur, a.numeroParu, a.date,
        a.created_at || a.date, a.date, a.private ?? true, a.rubrique || null, a.dossier_id || null,
        a.misEnLigne, a.rang ?? 0, a.lectures ?? 0, a.fileType || null,
      ],
    );
  },
  async update(a) {
    await query(
      `UPDATE articles SET
         titre_front=$2, description=$3, image_logo=$4, path=$5, auteur=$6, numero_paru=$7, date=$8,
         private=$9, rubrique_id=$10, dossier_id=$11, mis_en_ligne=$12, file_type=$13, updated_at=NOW()
       WHERE id=$1`,
      [
        a.id, a.titreFront, a.description, a.imageLogo, a.path, a.auteur, a.numeroParu, a.date,
        a.private, a.rubrique || null, a.dossier_id || null, a.misEnLigne, a.fileType || null,
      ],
    );
  },
  async togglePrivate(id) {
    const res = await query(
      'UPDATE articles SET private = NOT private, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id],
    );
    return mapArticle(res.rows[0]);
  },
  async incrementLectures(id) {
    await query('UPDATE articles SET lectures = COALESCE(lectures,0) + 1 WHERE id = $1', [id]);
  },
  async remove(id) {
    const res = await query('DELETE FROM articles WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
};

/* ---------- Archives ---------- */
export const archives = {
  async all() {
    const res = await query('SELECT * FROM archives ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapArchive);
  },
  async publicAll() {
    const res = await query('SELECT * FROM archives WHERE private = false ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapArchive);
  },
  async byId(id) {
    const res = await query('SELECT * FROM archives WHERE id = $1', [id]);
    return mapArchive(res.rows[0]);
  },
  async lastPublic() {
    const res = await query(
      'SELECT * FROM archives WHERE private = false ORDER BY date DESC NULLS LAST LIMIT 1',
    );
    return mapArchive(res.rows[0]);
  },
  async insert(a) {
    await query(
      `INSERT INTO archives (id, titre, description, date, numero, private, auteur_back, copyright_back, lectures)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [a.id, a.titre, a.description, a.date, a.numero, a.private ?? true, a.auteurBack, a.copyrightBack, a.lectures ?? 0],
    );
  },
  async update(a) {
    await query(
      `UPDATE archives SET titre=$2, description=$3, date=$4, numero=$5, private=$6,
         auteur_back=$7, copyright_back=$8, cover_path=COALESCE($9, cover_path),
         back_path=COALESCE($10, back_path), pdf_path=COALESCE($11, pdf_path)
       WHERE id=$1`,
      [
        a.id, a.titre, a.description, a.date, a.numero, a.private,
        a.auteurBack, a.copyrightBack, a.pathCover || null, a.pathBack || null, a.pathPdf || null,
      ],
    );
  },
  async togglePrivate(id) {
    await query('UPDATE archives SET private = NOT private WHERE id = $1', [id]);
  },
  async incrementLectures(id) {
    await query('UPDATE archives SET lectures = COALESCE(lectures,0) + 1 WHERE id = $1', [id]);
  },
  async remove(id) {
    const res = await query('DELETE FROM archives WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
};

/* ---------- News ---------- */
export const news = {
  async all() {
    const res = await query('SELECT * FROM news ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapNews);
  },
  async publicAll() {
    const res = await query('SELECT * FROM news WHERE private = false ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapNews);
  },
  async byId(id) {
    const res = await query('SELECT * FROM news WHERE id = $1', [id]);
    return mapNews(res.rows[0]);
  },
  async insert(n) {
    await query(
      `INSERT INTO news (id, titre, description, date, private, is_banner, banner_text, starts_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [n.id, n.titre, n.description, n.date, n.private ?? true, n.is_banner ?? false, n.banner_text || n.titre, n.starts_at || null, n.expires_at || null],
    );
  },
  async togglePrivate(id) {
    await query('UPDATE news SET private = NOT private WHERE id = $1', [id]);
  },
  async remove(id) {
    const res = await query('DELETE FROM news WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
  async activeBanner() {
    const res = await query(
      `SELECT * FROM news
       WHERE is_banner = true AND private = false
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (expires_at IS NULL OR expires_at >= NOW())
       ORDER BY created_at DESC LIMIT 1`,
    );
    return mapNews(res.rows[0]);
  },
  async expireBanners() {
    await query(
      `UPDATE news SET private = true
       WHERE is_banner = true AND private = false AND expires_at IS NOT NULL AND expires_at < NOW()`,
    );
  },
};

/* ---------- Focale ---------- */
export const focale = {
  async all() {
    const res = await query('SELECT * FROM focale ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapFocale);
  },
  async publicAll() {
    const res = await query('SELECT * FROM focale WHERE private = false ORDER BY date DESC NULLS LAST');
    return res.rows.map(mapFocale);
  },
  async byId(id) {
    const res = await query('SELECT * FROM focale WHERE id = $1', [id]);
    return mapFocale(res.rows[0]);
  },
  async insert(f) {
    await query(
      `INSERT INTO focale (id, titre, description, numero, auteur, technique, date, private)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [f.id, f.titre, f.description, f.numero, f.auteur, f.technique, f.date, f.private ?? true],
    );
  },
  async togglePrivate(id) {
    await query('UPDATE focale SET private = NOT private WHERE id = $1', [id]);
  },
  async remove(id) {
    const res = await query('DELETE FROM focale WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
};

/* ---------- Pages ---------- */
export const pages = {
  async bySlug(slug) {
    const res = await query('SELECT * FROM pages WHERE slug = $1', [slug]);
    return mapPage(res.rows[0]);
  },
  async all() {
    const res = await query('SELECT * FROM pages ORDER BY slug');
    return res.rows.map(mapPage);
  },
  async upsert(slug, { title, content }) {
    await query(
      `INSERT INTO pages (slug, title, content, updated_at)
       VALUES ($1,$2,$3::jsonb,NOW())
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, updated_at = NOW()`,
      [slug, title, JSON.stringify(content ?? {})],
    );
    return this.bySlug(slug);
  },
};

/* ---------- Newsletter ---------- */
export const newsletter = {
  async allSubscribers() {
    const res = await query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    return res.rows.map(mapSubscriber);
  },
  async countVerified() {
    const res = await query('SELECT COUNT(*)::int AS c FROM newsletter_subscribers WHERE verified = true');
    return res.rows[0].c;
  },
  async byMail(mail) {
    const res = await query('SELECT * FROM newsletter_subscribers WHERE mail = $1', [mail]);
    return mapSubscriber(res.rows[0]);
  },
  async byId(id) {
    const res = await query('SELECT * FROM newsletter_subscribers WHERE id = $1', [id]);
    return mapSubscriber(res.rows[0]);
  },
  async byToken(token) {
    const res = await query('SELECT * FROM newsletter_subscribers WHERE token = $1', [token]);
    return mapSubscriber(res.rows[0]);
  },
  async insertSubscriber(s) {
    await query(
      `INSERT INTO newsletter_subscribers (id, name, mail, verified, token, subscribed_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.id, s.name, s.mail, s.verified ?? false, s.token || null, s.subscribed_at || new Date().toISOString()],
    );
  },
  async verify(id) {
    await query('UPDATE newsletter_subscribers SET verified = true, token = NULL WHERE id = $1', [id]);
  },
  async removeByMailOrId(key) {
    const res = await query('DELETE FROM newsletter_subscribers WHERE mail = $1 OR id = $1', [key]);
    return res.rowCount > 0;
  },
  async verifiedMails() {
    const res = await query('SELECT mail FROM newsletter_subscribers WHERE verified = true');
    return res.rows.map((r) => r.mail).filter(Boolean);
  },
  async allCampaigns() {
    const res = await query('SELECT * FROM newsletter_campaigns ORDER BY created_at DESC');
    return res.rows.map(mapCampaign);
  },
  async campaignById(id) {
    const res = await query('SELECT * FROM newsletter_campaigns WHERE id = $1', [id]);
    return mapCampaign(res.rows[0]);
  },
  async insertCampaign(c) {
    await query(
      `INSERT INTO newsletter_campaigns (id, subject, html_body, sent_at, recipient_count, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,NULL,0,$4,NOW(),NOW())`,
      [c.id, c.subject, c.html_body, c.created_by || null],
    );
  },
  async updateCampaign(id, { subject, html_body }) {
    await query(
      `UPDATE newsletter_campaigns SET
         subject = COALESCE($2, subject),
         html_body = COALESCE($3, html_body),
         updated_at = NOW()
       WHERE id = $1 AND sent_at IS NULL`,
      [id, subject ?? null, html_body ?? null],
    );
  },
  async markCampaignSent(id, recipientCount) {
    await query(
      `UPDATE newsletter_campaigns SET sent_at = NOW(), recipient_count = $2, updated_at = NOW() WHERE id = $1`,
      [id, recipientCount],
    );
  },
};

/* ---------- Lectures history ---------- */
export const lectures = {
  async all() {
    const res = await query('SELECT date, lectures FROM lectures_history ORDER BY id');
    return res.rows.map((r) => ({ date: r.date, lectures: r.lectures }));
  },
  async push(entry) {
    await query('INSERT INTO lectures_history (date, lectures) VALUES ($1,$2)', [entry.date, entry.lectures]);
  },
  async last(n = 6) {
    const res = await query(
      'SELECT date, lectures FROM lectures_history ORDER BY id DESC LIMIT $1',
      [n],
    );
    return res.rows.map((r) => ({ date: r.date, lectures: r.lectures })).reverse();
  },
};

/* ---------- Proposer articles ---------- */
export const proposer = {
  async all() {
    const res = await query('SELECT id, data FROM proposer_articles ORDER BY created_at DESC');
    return res.rows.map((r) => ({ id: r.id, ...(typeof r.data === 'string' ? JSON.parse(r.data) : r.data) }));
  },
  async byId(id) {
    const res = await query('SELECT id, data FROM proposer_articles WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const data = typeof res.rows[0].data === 'string' ? JSON.parse(res.rows[0].data) : res.rows[0].data;
    return { id: res.rows[0].id, ...data };
  },
  async count() {
    const res = await query('SELECT COUNT(*)::int AS c FROM proposer_articles');
    return res.rows[0].c;
  },
  async insert(item) {
    const { id, ...rest } = item;
    await query('INSERT INTO proposer_articles (id, data) VALUES ($1,$2::jsonb)', [id, JSON.stringify(rest)]);
  },
  async remove(id) {
    const res = await query('DELETE FROM proposer_articles WHERE id = $1', [id]);
    return res.rowCount > 0;
  },
};
