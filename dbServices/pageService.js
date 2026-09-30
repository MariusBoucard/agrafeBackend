import fs from 'fs';
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';

function readData() {
  return JSON.parse(fs.readFileSync('data/pages.json', 'utf8'));
}

function saveData(data) {
  fs.writeFileSync('data/pages.json', JSON.stringify(data, null, 2));
}

const pageService = {
  getPage: async (slug) => {
    if (config.usePostgres) {
      const page = await repos.pages.bySlug(slug);
      if (!page) return { code: 404, page: null };
      return { code: 200, page };
    }
    const data = readData();
    const page = data.pages[slug];
    if (!page) return { code: 404, page: null };
    return { code: 200, page: { slug, ...page } };
  },

  updatePage: async (slug, pageData) => {
    if (config.usePostgres) {
      const existing = await repos.pages.bySlug(slug);
      const page = await repos.pages.upsert(slug, {
        title: pageData.title ?? existing?.title,
        content: pageData.content ?? existing?.content,
      });
      return { code: 200, page };
    }
    const data = readData();
    if (!data.pages[slug]) {
      data.pages[slug] = { title: pageData.title, content: pageData.content };
    } else {
      data.pages[slug].title = pageData.title ?? data.pages[slug].title;
      data.pages[slug].content = pageData.content ?? data.pages[slug].content;
    }
    data.pages[slug].updated_at = new Date().toISOString();
    saveData(data);
    return { code: 200, page: { slug, ...data.pages[slug] } };
  },

  getAllPages: async () => {
    if (config.usePostgres) return { code: 200, pages: await repos.pages.all() };
    const data = readData();
    return {
      code: 200,
      pages: Object.entries(data.pages).map(([slug, p]) => ({ slug, ...p })),
    };
  },
};

export default pageService;
