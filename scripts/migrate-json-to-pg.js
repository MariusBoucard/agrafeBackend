import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import { getPool } from '../db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

function readJson(filename) {
  const p = path.join(dataDir, filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseDate(value) {
  if (!value) return null;
  return String(value);
}

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const users = readJson('user.json');
    if (users?.users) {
      for (const u of users.users) {
        await client.query(
          `INSERT INTO users (id, name, mail, hash, role, profile_slug, bio, avatar, mail_check)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, mail = EXCLUDED.mail, hash = EXCLUDED.hash,
             role = EXCLUDED.role, profile_slug = EXCLUDED.profile_slug,
             bio = EXCLUDED.bio, avatar = EXCLUDED.avatar, mail_check = EXCLUDED.mail_check`,
          [
            u.id,
            u.name,
            u.mail,
            u.hash,
            u.type || u.role || 'contributor',
            u.profile_slug || u.name?.toLowerCase().replace(/\s+/g, '-'),
            u.bio || '',
            u.avatar || null,
            u.mailCheck ?? true,
          ],
        );
      }
      console.log(`Migrated ${users.users.length} users`);
    }

    const rubriques = readJson('rubrique.json');
    if (rubriques?.rubriques) {
      for (const r of rubriques.rubriques) {
        await client.query(
          `INSERT INTO rubriques (id, rubrique, description, rub_route, information, nombre_sec_min, nombre_sec_max, nombre_articles)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             rubrique = EXCLUDED.rubrique, description = EXCLUDED.description,
             rub_route = EXCLUDED.rub_route, information = EXCLUDED.information,
             nombre_sec_min = EXCLUDED.nombre_sec_min, nombre_sec_max = EXCLUDED.nombre_sec_max,
             nombre_articles = EXCLUDED.nombre_articles`,
          [
            r.id,
            r.rubrique,
            r.description,
            r.rubRoute,
            r.information,
            r.nombreSecMin ?? 0,
            r.nombreSecMax ?? 0,
            r.nombreArticles ?? 0,
          ],
        );
      }
      console.log(`Migrated ${rubriques.rubriques.length} rubriques`);
    }

    const dossiers = readJson('dossiers.json');
    if (dossiers?.dossiers) {
      for (const d of dossiers.dossiers) {
        await client.query(
          `INSERT INTO dossiers (id, titre, description, statut, rubrique_id, featured, ordre, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre, description = EXCLUDED.description, statut = EXCLUDED.statut,
             rubrique_id = EXCLUDED.rubrique_id, featured = EXCLUDED.featured, ordre = EXCLUDED.ordre`,
          [
            d.id,
            d.titre,
            d.description || '',
            d.statut || 'en_cours',
            d.rubrique_id || null,
            d.featured ?? false,
            d.ordre ?? 0,
            d.created_at || new Date().toISOString(),
            d.updated_at || d.created_at || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${dossiers.dossiers.length} dossiers`);
    }

    const articles = readJson('article.json');
    if (articles?.articles) {
      for (const a of articles.articles) {
        await client.query(
          `INSERT INTO articles (
             id, titre_front, description, image_logo, path, auteur, numero_paru, date,
             created_at, published_at, private, rubrique_id, dossier_id, mis_en_ligne, rang, lectures, file_type
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (id) DO UPDATE SET
             titre_front = EXCLUDED.titre_front, description = EXCLUDED.description,
             image_logo = EXCLUDED.image_logo, path = EXCLUDED.path, auteur = EXCLUDED.auteur,
             numero_paru = EXCLUDED.numero_paru, date = EXCLUDED.date, private = EXCLUDED.private,
             rubrique_id = EXCLUDED.rubrique_id, dossier_id = EXCLUDED.dossier_id,
             mis_en_ligne = EXCLUDED.mis_en_ligne, rang = EXCLUDED.rang, lectures = EXCLUDED.lectures`,
          [
            a.id,
            a.titreFront,
            a.description,
            a.imageLogo,
            a.path,
            a.auteur,
            a.numeroParu,
            parseDate(a.date),
            parseDate(a.created_at || a.date),
            parseDate(a.date),
            a.private ?? false,
            a.rubrique || null,
            a.dossier_id || null,
            a.misEnLigne,
            a.rang ?? 0,
            a.lectures ?? 0,
            a.fileType || null,
          ],
        );
      }
      console.log(`Migrated ${articles.articles.length} articles`);
    }

    const archives = readJson('archive.json');
    if (archives?.archives) {
      for (const ar of archives.archives) {
        await client.query(
          `INSERT INTO archives (id, titre, description, date, numero, private, cover_path, back_path, pdf_path, auteur_back, copyright_back, lectures)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre, description = EXCLUDED.description, date = EXCLUDED.date,
             numero = EXCLUDED.numero, private = EXCLUDED.private, auteur_back = EXCLUDED.auteur_back,
             copyright_back = EXCLUDED.copyright_back, lectures = EXCLUDED.lectures`,
          [
            ar.id,
            ar.titre,
            ar.description,
            parseDate(ar.date),
            ar.numero,
            ar.private ?? false,
            ar.cover || ar.pathCover || null,
            ar.back || ar.pathBack || null,
            ar.pdf || ar.pathPdf || null,
            ar.auteurBack || null,
            ar.copyrightBack || null,
            ar.lectures ?? 0,
          ],
        );
      }
      console.log(`Migrated ${archives.archives.length} archives`);
    }

    const newsletter = readJson('newsletter.json');
    if (newsletter?.newsletter) {
      for (const n of newsletter.newsletter) {
        const verified = n.verified === undefined || n.verified === null ? true : !!n.verified;
        await client.query(
          `INSERT INTO newsletter_subscribers (id, name, mail, verified, token, subscribed_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (mail) DO UPDATE SET
             name = EXCLUDED.name, verified = EXCLUDED.verified, token = EXCLUDED.token`,
          [
            n.id || nanoid(),
            n.name,
            n.mail,
            verified,
            n.token || null,
            n.subscribed_at || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${newsletter.newsletter.length} newsletter subscribers`);
    }

    const campaigns = readJson('newsletter_campaigns.json');
    if (campaigns?.campaigns) {
      for (const c of campaigns.campaigns) {
        await client.query(
          `INSERT INTO newsletter_campaigns (id, subject, html_body, sent_at, recipient_count, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
             sent_at = EXCLUDED.sent_at, recipient_count = EXCLUDED.recipient_count`,
          [
            c.id,
            c.subject,
            c.html_body,
            c.sent_at || null,
            c.recipient_count ?? 0,
            c.created_by || null,
            c.created_at || new Date().toISOString(),
            c.updated_at || c.created_at || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${campaigns.campaigns.length} campaigns`);
    }

    const news = readJson('news.json');
    if (news?.news) {
      for (const n of news.news) {
        await client.query(
          `INSERT INTO news (id, titre, description, date, private, is_banner, banner_text, starts_at, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre, description = EXCLUDED.description, date = EXCLUDED.date,
             private = EXCLUDED.private, is_banner = EXCLUDED.is_banner, banner_text = EXCLUDED.banner_text`,
          [
            n.id,
            n.titre,
            n.description,
            parseDate(n.date),
            n.private ?? true,
            n.is_banner ?? false,
            n.banner_text || n.titre,
            n.starts_at || null,
            n.expires_at || null,
          ],
        );
      }
      console.log(`Migrated ${news.news.length} news items`);
    }

    const focale = readJson('focale.json');
    if (focale?.focale) {
      for (const f of focale.focale) {
        await client.query(
          `INSERT INTO focale (id, titre, description, numero, auteur, technique, date, private)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre, description = EXCLUDED.description, private = EXCLUDED.private`,
          [
            f.id,
            f.titre,
            f.description,
            f.numero || null,
            f.auteur || null,
            f.technique || null,
            parseDate(f.date),
            f.private ?? true,
          ],
        );
      }
      console.log(`Migrated ${focale.focale.length} focale items`);
    }

    const lectures = readJson('lectures.json');
    if (lectures?.lectures?.length) {
      await client.query('DELETE FROM lectures_history');
      for (const l of lectures.lectures) {
        await client.query('INSERT INTO lectures_history (date, lectures) VALUES ($1,$2)', [
          String(l.date),
          l.lectures ?? 0,
        ]);
      }
      console.log(`Migrated ${lectures.lectures.length} lecture records`);
    }

    const pages = readJson('pages.json');
    if (pages?.pages) {
      for (const [slug, page] of Object.entries(pages.pages)) {
        await client.query(
          `INSERT INTO pages (slug, title, content, updated_at)
           VALUES ($1,$2,$3::jsonb,$4)
           ON CONFLICT (slug) DO UPDATE SET
             title = EXCLUDED.title, content = EXCLUDED.content, updated_at = EXCLUDED.updated_at`,
          [
            slug,
            page.title || slug,
            JSON.stringify(page.content || {}),
            page.updated_at || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${Object.keys(pages.pages).length} pages`);
    }

    const proposer = readJson('proposerArticle.json');
    if (proposer?.articles) {
      for (const a of proposer.articles) {
        const { id, ...rest } = a;
        await client.query(
          `INSERT INTO proposer_articles (id, data) VALUES ($1,$2::jsonb)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [id, JSON.stringify(rest)],
        );
      }
      console.log(`Migrated ${proposer.articles.length} proposer articles`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
