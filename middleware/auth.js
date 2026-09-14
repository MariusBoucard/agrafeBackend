import jsonWebToken from 'jsonwebtoken';
import { config } from '../config/env.js';
import userService from '../dbServices/userService.js';

function extractToken(req) {
  const header = req.header('Authorization');
  if (!header) return null;
  if (header.startsWith('Bearer ')) return header.slice(7);
  return header;
}

export function authenticateToken(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jsonWebToken.verify(token, config.jwtSecret, async (err, payload) => {
    if (err) return res.status(403).json({ message: 'Token is not valid' });
    try {
      const userId = payload.userId;
      const userResult = await userService.getUserById(userId);
      if (!userResult.user) {
        return res.status(403).json({ message: 'User not found' });
      }
      req.user = {
        id: userResult.user.id,
        role: userResult.user.type || userResult.user.role || 'contributor',
        name: userResult.user.name,
        mail: userResult.user.mail,
      };
      next();
    } catch (e) {
      return res.status(500).json({ message: 'Auth error' });
    }
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export function generateToken(userId, role) {
  return jsonWebToken.sign({ userId, role }, config.jwtSecret, { expiresIn: '7d' });
}
