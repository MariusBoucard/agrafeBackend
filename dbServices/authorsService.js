import articleService from './articlesService.js';
import userService from './userService.js';
import {
  resolveAuthorSlugForName,
  normalizeAuthor,
  splitAuthorNames,
  articleMatchesAuthor,
} from '../utils/authorSlug.js';

/**
 * Liste publique des auteurs (articles publiés), enrichie avec les profils comptes.
 * Les coécritures sont découpées pour n’afficher chaque rédacteur qu’une fois.
 */
async function listAuthors() {
  const articlesRes = await articleService.getAllPublicArticles();
  const articles = articlesRes.article || [];
  const usersRes = await userService.getAllUser();
  const users = usersRes.users || [];

  const bySlug = new Map();

  for (const article of articles) {
    const names = splitAuthorNames(article.auteur);
    // Un article ne compte qu’une fois par slug (évite les doublons de noms mal formés).
    const seenInArticle = new Set();

    for (const name of names) {
      const slug = resolveAuthorSlugForName(name, users);
      if (!slug || seenInArticle.has(slug)) continue;
      seenInArticle.add(slug);

      if (!bySlug.has(slug)) {
        const nameNorm = normalizeAuthor(name);
        const linked =
          users.find((u) => u?.name && normalizeAuthor(u.name) === nameNorm) ||
          users
            .filter((u) => {
              if (!u?.name) return false;
              const uNorm = normalizeAuthor(u.name);
              return nameNorm === uNorm || nameNorm.startsWith(`${uNorm} `);
            })
            .sort((a, b) => String(b.name).length - String(a.name).length)[0];

        bySlug.set(slug, {
          name: linked?.name || name,
          slug,
          bio: linked?.bio || '',
          articleCount: 0,
          hasAccount: Boolean(linked),
        });
      }
      bySlug.get(slug).articleCount += 1;
    }
  }

  const authors = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );

  return { code: 200, authors };
}

async function getPublicProfile(slug) {
  const userRes = await userService.getUserBySlug(slug);
  const articlesRes = await articleService.getAllPublicArticles();
  const articles = articlesRes.article || [];

  let user = userRes.user || null;
  const matching = articles.filter((a) =>
    articleMatchesAuthor(a, { name: user?.name, slug })
  );

  if (!user && matching.length) {
    const fromArticle =
      splitAuthorNames(matching[0].auteur).find(
        (n) => resolveAuthorSlugForName(n, []) === slug
      ) || matching[0].auteur;

    user = {
      name: fromArticle,
      bio: '',
      socials: {},
      profile_slug: slug,
    };
  }

  if (!user) return { code: 404, user: null, articles: [] };

  const { mail, hash, ...publicUser } = user;
  return { code: 200, user: publicUser, articles: matching };
}

export default { listAuthors, getPublicProfile };
