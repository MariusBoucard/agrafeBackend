import articleService from './articlesService.js';
import userService from './userService.js';
import { resolveAuthorSlug, normalizeAuthor } from '../utils/authorSlug.js';

/**
 * Liste publique des auteurs (articles publiés), enrichie avec les profils comptes.
 */
async function listAuthors() {
  const articlesRes = await articleService.getAllPublicArticles();
  const articles = articlesRes.article || [];
  const usersRes = await userService.getAllUser();
  const users = usersRes.users || [];

  const bySlug = new Map();

  for (const article of articles) {
    const auteur = String(article.auteur || '').trim();
    if (!auteur) continue;
    const slug = resolveAuthorSlug(auteur, users);
    if (!slug) continue;

    if (!bySlug.has(slug)) {
      const linked = users
        .filter((u) => u?.name && normalizeAuthor(auteur).includes(normalizeAuthor(u.name)))
        .sort((a, b) => String(b.name).length - String(a.name).length)[0];

      bySlug.set(slug, {
        name: linked?.name || auteur,
        slug,
        bio: linked?.bio || '',
        articleCount: 0,
        hasAccount: Boolean(linked),
      });
    }
    bySlug.get(slug).articleCount += 1;
  }

  const authors = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );

  return { code: 200, authors };
}

export default { listAuthors };
