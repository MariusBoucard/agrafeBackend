/** Map PG rows ↔ API camelCase shapes used by the frontend. */

export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    mail: row.mail,
    type: row.role,
    role: row.role,
    profile_slug: row.profile_slug,
    bio: row.bio || '',
    avatar: row.avatar,
    mailCheck: row.mail_check,
  };
}

export function mapRubrique(row) {
  if (!row) return null;
  return {
    id: row.id,
    rubrique: row.rubrique,
    description: row.description,
    rubRoute: row.rub_route,
    information: row.information,
    nombreSecMin: row.nombre_sec_min,
    nombreSecMax: row.nombre_sec_max,
    nombreArticles: row.nombre_articles,
  };
}

export function mapDossier(row) {
  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    statut: row.statut,
    rubrique_id: row.rubrique_id,
    featured: row.featured,
    ordre: row.ordre,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapArticle(row) {
  if (!row) return null;
  return {
    id: row.id,
    titreFront: row.titre_front,
    description: row.description,
    imageLogo: row.image_logo,
    path: row.path,
    auteur: row.auteur,
    numeroParu: row.numero_paru,
    date: row.date,
    created_at: row.created_at || row.date,
    published_at: row.published_at,
    updated_at: row.updated_at,
    private: row.private,
    rubrique: row.rubrique_id,
    dossier_id: row.dossier_id,
    misEnLigne: row.mis_en_ligne,
    rang: row.rang,
    lectures: row.lectures ?? 0,
    fileType: row.file_type,
  };
}

export function mapArchive(row) {
  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    date: row.date,
    numero: row.numero,
    private: row.private,
    lectures: row.lectures ?? 0,
    auteurBack: row.auteur_back,
    copyrightBack: row.copyright_back,
    pathCover: row.cover_path,
    pathBack: row.back_path,
    pathPdf: row.pdf_path,
  };
}

export function mapNews(row) {
  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    date: row.date,
    private: row.private,
    is_banner: row.is_banner,
    banner_text: row.banner_text,
    starts_at: row.starts_at,
    expires_at: row.expires_at,
  };
}

export function mapFocale(row) {
  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    numero: row.numero,
    auteur: row.auteur,
    technique: row.technique,
    date: row.date,
    private: row.private,
  };
}

export function mapSubscriber(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    mail: row.mail,
    verified: row.verified,
    token: row.token,
    subscribed_at: row.subscribed_at,
  };
}

export function mapCampaign(row) {
  if (!row) return null;
  return {
    id: row.id,
    subject: row.subject,
    html_body: row.html_body,
    sent_at: row.sent_at,
    recipient_count: row.recipient_count,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapPage(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    updated_at: row.updated_at,
  };
}
