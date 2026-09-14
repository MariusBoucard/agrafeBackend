/**
 * One-shot : dans les blocs image d’articles, copyright → auteur si auteur vide, puis drop copyright.
 * Pas de changement SQL (contenu JSON fichiers articleText).
 *
 * Usage : node scripts/migrate-image-copyright-to-auteur.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { sanitizeImageCredits, contenuCreditsChanged } from '../utils/imageCredit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articleTextDir = path.join(__dirname, '../save/saveArticle/articleText');

function migrateDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Aucun dossier ${dir}`);
    return { filesChanged: 0, imagesTouched: 0 };
  }
  let filesChanged = 0;
  let imagesTouched = 0;
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
  for (const name of names) {
    const filePath = path.join(dir, name);
    let contenu;
    try {
      contenu = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      console.warn(`Ignore (JSON invalide) : ${name}`);
      continue;
    }
    if (!Array.isArray(contenu)) continue;
    const beforeCount = contenu.filter((p) => p?.type === 'image' && 'copyright' in p).length;
    const next = sanitizeImageCredits(contenu);
    if (!contenuCreditsChanged(contenu, next)) continue;
    fs.writeFileSync(filePath, JSON.stringify(next));
    filesChanged += 1;
    imagesTouched += beforeCount;
    console.log(`OK ${name} (${beforeCount} image(s))`);
  }
  return { filesChanged, imagesTouched };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const { filesChanged, imagesTouched } = migrateDir(articleTextDir);
  console.log(`Migration terminée : ${imagesTouched} image(s) dans ${filesChanged} fichier(s).`);
}
