/** Normalize text for author matching (accents / case). */
export function normalizeAuthor(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Build a URL-safe slug from an author display name. */
export function slugifyAuthor(str = '') {
  return normalizeAuthor(str)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Découpe une chaîne d’auteurs coécrits en noms individuels.
 * Gère « A et B », « A, B et C », « A & B », et les suffixes du type «, étudiantes… ».
 */
export function splitAuthorNames(auteur = '') {
  let raw = String(auteur || '').trim();
  if (!raw) return [];

  const avecPart = raw.match(/^(.+?),\s*avec la participation de\s+(.+)$/i);
  if (avecPart) {
    return [...splitAuthorNames(avecPart[1]), avecPart[2].trim()].filter(Boolean);
  }

  raw = raw
    .replace(/,\s*étudiantes?\b.*$/i, '')
    .replace(/,\s*étudiants?\b.*$/i, '')
    .trim();

  const parts = raw
    .split(/\s*,\s*/)
    .flatMap((part) => part.split(/\s+(?:et|&)\s+/i))
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.length ? parts : [raw];
}

function findLinkedUser(name, users = []) {
  const nameNorm = normalizeAuthor(name);
  if (!nameNorm) return null;
  const list = users || [];
  const exact = list.find((u) => u?.name && normalizeAuthor(u.name) === nameNorm);
  if (exact) return exact;
  // Repli : signature d’article plus longue que le compte (« Syriane Jacq » ↔ « Syriane »).
  // Évite les faux positifs du type « Jean » ⊂ « Jeanne ».
  return list
    .filter((u) => {
      if (!u?.name) return false;
      const uNorm = normalizeAuthor(u.name);
      return nameNorm === uNorm || nameNorm.startsWith(`${uNorm} `);
    })
    .sort((a, b) => String(b.name).length - String(a.name).length)[0] || null;
}

/**
 * Resolve portfolio slug for a single author display name.
 */
export function resolveAuthorSlugForName(name, users = []) {
  if (!name) return null;
  const match = findLinkedUser(name, users);
  if (match?.profile_slug) return match.profile_slug;
  if (match?.name) return slugifyAuthor(match.name);
  return slugifyAuthor(name) || null;
}

/**
 * Resolve portfolio slug for an article author string (premier auteur si coécriture).
 * Prefers a matching user profile_slug when available.
 */
export function resolveAuthorSlug(auteur, users = []) {
  const names = splitAuthorNames(auteur);
  if (!names.length) return null;
  return resolveAuthorSlugForName(names[0], users);
}

/**
 * Liste { name, slug } pour chaque rédacteur d’une signature d’article.
 */
export function resolveAuthorEntries(auteur, users = []) {
  return splitAuthorNames(auteur)
    .map((name) => ({
      name,
      slug: resolveAuthorSlugForName(name, users),
    }))
    .filter((e) => e.slug);
}

export function articleMatchesAuthor(article, { name, slug } = {}) {
  if (!article?.auteur) return false;
  const names = splitAuthorNames(article.auteur);
  const nameNorm = name ? normalizeAuthor(name) : '';
  const slugNorm = slug ? String(slug).toLowerCase() : '';

  for (const part of names) {
    const partNorm = normalizeAuthor(part);
    if (nameNorm && partNorm === nameNorm) return true;
    if (slugNorm && slugifyAuthor(part) === slugNorm) return true;
  }

  // Compat : ancien slug combiné « alice-et-bob »
  if (slugNorm && slugifyAuthor(article.auteur) === slugNorm) return true;
  if (nameNorm && normalizeAuthor(article.auteur) === nameNorm) return true;

  return false;
}
