import { nanoid } from 'nanoid';
import fs from 'fs';
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';

function readData() {
  return JSON.parse(fs.readFileSync('data/dossiers.json', 'utf8'));
}

function saveData(data) {
  fs.writeFileSync('data/dossiers.json', JSON.stringify(data, null, 2));
}

const dossierService = {
  getAll: async () => {
    if (config.usePostgres) return { code: 200, dossiers: await repos.dossiers.all() };
    const data = readData();
    return { code: 200, dossiers: data.dossiers };
  },

  getPublic: async () => {
    if (config.usePostgres) return { code: 200, dossiers: await repos.dossiers.all() };
    const data = readData();
    const sorted = [...data.dossiers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { code: 200, dossiers: sorted };
  },

  getById: async (id) => {
    if (config.usePostgres) {
      const dossier = await repos.dossiers.byId(id);
      if (!dossier) return { code: 404, dossier: null };
      return { code: 200, dossier };
    }
    const data = readData();
    const dossier = data.dossiers.find((d) => d.id === id);
    if (!dossier) return { code: 404, dossier: null };
    return { code: 200, dossier };
  },

  add: async (dossier) => {
    const item = {
      id: nanoid(),
      titre: dossier.titre,
      description: dossier.description || '',
      statut: dossier.statut || 'en_cours',
      rubrique_id: dossier.rubrique_id || null,
      featured: dossier.featured ?? false,
      ordre: dossier.ordre ?? 0,
      created_at: new Date().toISOString(),
    };
    if (config.usePostgres) {
      await repos.dossiers.insert(item);
      return { code: 200, dossier: item };
    }
    const data = readData();
    data.dossiers.push(item);
    saveData(data);
    return { code: 200, dossier: item };
  },

  modify: async (dossier) => {
    if (config.usePostgres) {
      const existing = await repos.dossiers.byId(dossier.id);
      if (!existing) return { code: 404, message: 'Dossier not found' };
      const updated = { ...existing, ...dossier, updated_at: new Date().toISOString() };
      await repos.dossiers.update(updated);
      return { code: 200, dossier: updated };
    }
    const data = readData();
    const idx = data.dossiers.findIndex((d) => d.id === dossier.id);
    if (idx === -1) return { code: 404, message: 'Dossier not found' };
    data.dossiers[idx] = { ...data.dossiers[idx], ...dossier, updated_at: new Date().toISOString() };
    saveData(data);
    return { code: 200, dossier: data.dossiers[idx] };
  },

  delete: async (id) => {
    if (config.usePostgres) {
      if (!await repos.dossiers.remove(id)) return { code: 404, message: 'Dossier not found' };
      return { code: 200, message: 'Dossier deleted' };
    }
    const data = readData();
    const idx = data.dossiers.findIndex((d) => d.id === id);
    if (idx === -1) return { code: 404, message: 'Dossier not found' };
    data.dossiers.splice(idx, 1);
    saveData(data);
    return { code: 200, message: 'Dossier deleted' };
  },
};

export default dossierService;
