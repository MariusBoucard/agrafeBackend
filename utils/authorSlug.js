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
 * Resolve portfolio slug for an article author string.
 * Prefers a matching user profile_slug when the author name contains the user name.
 */
export function resolveAuthorSlug(auteur, users = []) {
  if (!auteur) return null;
  const auteurNorm = normalizeAuthor(auteur);
  const match = (users || [])
    .filter((u) => u?.name && auteurNorm.includes(normalizeAuthor(u.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (match?.profile_slug) return match.profile_slug;
  return slugifyAuthor(auteur) || null;
}

export function articleMatchesAuthor(article, { name, slug } = {}) {
  if (!article?.auteur) return false;
  const auteurNorm = normalizeAuthor(article.auteur);
  if (name && auteurNorm.includes(normalizeAuthor(name))) return true;
  if (slug && slugifyAuthor(article.auteur) === slug) return true;
  return false;
}
