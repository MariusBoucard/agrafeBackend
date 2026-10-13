/** Clés de réseaux sociaux autorisées pour les profils portfolio. */
export const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'x', 'website'];

export function normalizeSocials(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const key of SOCIAL_KEYS) {
    const value = String(input[key] ?? '').trim();
    if (value) out[key] = value;
  }
  return out;
}

export function parseSocials(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return normalizeSocials(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return normalizeSocials(raw);
}
