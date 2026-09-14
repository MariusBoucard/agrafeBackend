/**
 * Crédit photo d’un bloc image d’article : champ `auteur` uniquement.
 * Ancien champ `copyright` : recopié vers `auteur` s’il est vide, puis ignoré.
 */
export function sanitizeImageCredits(contenu) {
  if (!Array.isArray(contenu)) return contenu;
  return contenu.map((part) => {
    if (!part || typeof part !== 'object' || part.type !== 'image') return part;
    const next = { ...part };
    const auteur = String(next.auteur || '').trim();
    const copyright = String(next.copyright || '').trim();
    if (!auteur && copyright) next.auteur = copyright;
    delete next.copyright;
    return next;
  });
}

export function contenuCreditsChanged(before, after) {
  return JSON.stringify(before) !== JSON.stringify(after);
}
