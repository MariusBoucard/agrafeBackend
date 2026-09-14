/** Rôles L'Agrafe — source de vérité backend */
export const ROLES = {
  CONTRIBUTOR: 'contributor',
  EDITOR: 'editor',
  ADMIN: 'admin',
};

export const ROLE_LEVEL = {
  contributor: 1,
  editor: 2,
  admin: 3,
};

/** Mappe les anciens `type` JSON vers les rôles */
export function normalizeRole(roleOrType) {
  const r = String(roleOrType || '').toLowerCase();
  if (r === 'admin') return ROLES.ADMIN;
  if (r === 'editor') return ROLES.EDITOR;
  if (r === 'contributor' || r === 'user') return ROLES.CONTRIBUTOR;
  return ROLES.CONTRIBUTOR;
}

export function roleLevel(role) {
  return ROLE_LEVEL[normalizeRole(role)] || 1;
}

export function hasMinRole(userRole, minRole) {
  return roleLevel(userRole) >= roleLevel(minRole);
}

/**
 * Middleware : exige au moins le rôle indiqué (hiérarchie).
 * Ex. requireMinRole('editor') accepte editor et admin.
 */
export function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!hasMinRole(req.user.role, minRole)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        required: minRole,
        current: req.user.role,
      });
    }
    next();
  };
}

/** Middleware : exige un des rôles listés (égalité stricte, legacy) */
export function requireRole(...roles) {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowed.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
