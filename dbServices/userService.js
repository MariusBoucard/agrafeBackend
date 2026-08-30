import { nanoid } from 'nanoid';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jsonWebToken from 'jsonwebtoken';
import { config } from '../config/env.js';
import * as userRepo from '../db/userRepository.js';
import { normalizeRole, requireMinRole, requireRole } from '../middleware/roles.js';

function readDataFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('data/user.json', 'utf8', (err, data) => {
      if (err) reject(err);
      else {
        try {
          resolve(JSON.parse(data));
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}

function saveToFile(data) {
  fs.writeFileSync('data/user.json', JSON.stringify(data, null, 2));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { hash, ...safe } = user;
  safe.role = normalizeRole(safe.role || safe.type);
  safe.type = safe.role;
  return safe;
}

const userService = {
  addAdminUser: async function addAdminUser(user) {
    if ('name' in user && 'mail' in user && 'password' in user) {
      const userToAdd = {
        id: nanoid(),
        type: 'admin',
        role: 'admin',
        name: user.name,
        mail: user.mail,
        hash: user.password,
        mailCheck: true,
        profile_slug: user.name.toLowerCase().replace(/\s+/g, '-'),
        bio: '',
        avatar: null,
      };
      if (config.usePostgres) {
        if (!await userRepo.pgGetUserByMail(userToAdd.mail)) {
          await userRepo.pgInsertUser(userToAdd);
          return { code: 200, message: 'User added' };
        }
        return { code: 500, message: 'Utilisateur déja existant' };
      }
      const data = await readDataFromFile();
      if (!data.users.find((e) => e.mail === userToAdd.mail)) {
        data.users.push(userToAdd);
        saveToFile(data);
        return { code: 200, message: 'User added' };
      }
      return { code: 500, message: 'Utilisateur déja existant' };
    }
    return { code: 400, message: 'Invalid user data' };
  },

  addUser: async function addUser(user) {
    if ('name' in user && 'mail' in user && 'password' in user) {
      const userToAdd = {
        id: nanoid(),
        type: user.role || 'contributor',
        role: user.role || 'contributor',
        name: user.name,
        mail: user.mail,
        hash: user.password,
        mailCheck: true,
        profile_slug: user.name.toLowerCase().replace(/\s+/g, '-'),
        bio: '',
        avatar: null,
      };
      if (config.usePostgres) {
        if (!await userRepo.pgGetUserByMail(userToAdd.mail)) {
          await userRepo.pgInsertUser(userToAdd);
          return { code: 200, message: 'User added' };
        }
        return { code: 500, message: 'User deja existant' };
      }
      const data = await readDataFromFile();
      if (!data.users.find((aa) => aa.mail === userToAdd.mail)) {
        data.users.push(userToAdd);
        saveToFile(data);
        return { code: 200, message: 'User added' };
      }
      return { code: 500, message: 'User deja existant' };
    }
    return { code: 400, message: 'Invalid user data' };
  },

  deleteUser: async function deleteUser(id) {
    if (config.usePostgres) {
      if (await userRepo.pgDeleteUser(id)) return { code: 200, message: 'User deleted' };
      return { code: 404, message: 'User not found' };
    }
    const rawData = await readDataFromFile();
    const index = rawData.users.findIndex((idd) => id === idd.id);
    if (index !== -1) {
      rawData.users.splice(index, 1);
      saveToFile(rawData);
      return { code: 200, message: 'User deleted' };
    }
    return { code: 404, message: 'User not found' };
  },

  modifyUser: async function modifyUser(user) {
    if (config.usePostgres) {
      const existing = await userRepo.pgGetUserById(user.id);
      if (!existing) return { code: 404, message: 'User not found' };
      const role = user.role ? normalizeRole(user.role) : existing.role;
      const updated = {
        ...existing,
        name: user.name ?? existing.name,
        mail: user.mail ?? existing.mail,
        role,
        type: role,
        bio: user.bio !== undefined ? user.bio : existing.bio,
        profile_slug: user.profile_slug !== undefined ? user.profile_slug : existing.profile_slug,
      };
      if (user.password && String(user.password).length >= 6) {
        updated.hash = bcrypt.hashSync(user.password, 10);
      }
      await userRepo.pgUpdateUser(updated);
      return { code: 200, message: 'User modified' };
    }
    const rawData = await readDataFromFile();
    const userFound = rawData.users.find((idd) => user.id === idd.id);
    if (userFound) {
      userFound.name = user.name ?? userFound.name;
      userFound.mail = user.mail ?? userFound.mail;
      if (user.role) {
        const role = normalizeRole(user.role);
        userFound.role = role;
        userFound.type = role;
      }
      if (user.bio !== undefined) userFound.bio = user.bio;
      if (user.profile_slug !== undefined) userFound.profile_slug = user.profile_slug;
      if (user.password && String(user.password).length >= 6) {
        userFound.hash = bcrypt.hashSync(user.password, 10);
      }
      saveToFile(rawData);
      return { code: 200, message: 'User modified' };
    }
    return { code: 404, message: 'User not found' };
  },

  getUser: async function getUser(id) {
    if (config.usePostgres) {
      const user = await userRepo.pgGetUserById(id);
      if (user) return { code: 200, user, message: 'User found' };
      return { code: 404, user: null, message: 'User not found' };
    }
    const rawData = await readDataFromFile();
    const userFound = rawData.users.find((idd) => id === idd.id);
    if (userFound) {
      return { code: 200, user: sanitizeUser(userFound), message: 'User found' };
    }
    return { code: 404, user: null, message: 'User not found' };
  },

  getUserById: async function getUserById(id) {
    return this.getUser(id);
  },

  getUserBySlug: async function getUserBySlug(slug) {
    if (config.usePostgres) {
      const user = await userRepo.pgGetUserBySlug(slug);
      if (user) return { code: 200, user, message: 'User found' };
      return { code: 404, user: null, message: 'User not found' };
    }
    const rawData = await readDataFromFile();
    const userFound = rawData.users.find((u) => u.profile_slug === slug);
    if (userFound) {
      return { code: 200, user: sanitizeUser(userFound), message: 'User found' };
    }
    return { code: 404, user: null, message: 'User not found' };
  },

  getAllUser: async function getAllUser() {
    if (config.usePostgres) {
      const users = await userRepo.pgGetAllUsers();
      return { code: 200, message: 'Users found', users };
    }
    const rawData = await readDataFromFile();
    const users = rawData.users.map(sanitizeUser);
    return { code: 200, message: 'Users found', users };
  },

  doUserExists: async function doUserExists(user) {
    if (config.usePostgres) {
      const row = await userRepo.pgGetUserByMail(user.mail);
      if (!row || !bcrypt.compareSync(user.password, row.hash)) return false;
      const role = normalizeRole(row.role);
      return { id: row.id, role, type: role, name: row.name, mail: row.mail };
    }
    const rawData = await readDataFromFile();
    const userFound = rawData.users.find((u) => u.mail === user.mail);
    if (!userFound || !bcrypt.compareSync(user.password, userFound.hash)) {
      return false;
    }
    const role = normalizeRole(userFound.role || userFound.type);
    return { ...userFound, role, type: role };
  },

  generateToken(userOrId) {
    const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const role =
      typeof userOrId === 'object'
        ? normalizeRole(userOrId.role || userOrId.type)
        : 'contributor';
    return jsonWebToken.sign({ userId, role }, config.jwtSecret, { expiresIn: '7d' });
  },

  authenticateToken(req, res, next) {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jsonWebToken.verify(token, config.jwtSecret, async (err, payload) => {
      if (err) return res.status(403).json({ message: 'Token is not valid' });
      try {
        const result = await userService.getUserById(payload.userId);
        if (!result.user) return res.status(403).json({ message: 'User not found' });
        const role = normalizeRole(result.user.role || result.user.type || payload.role);
        req.user = {
          id: result.user.id,
          role,
          name: result.user.name,
          mail: result.user.mail,
        };
        next();
      } catch {
        return res.status(500).json({ message: 'Auth error' });
      }
    });
  },

  requireRole,
  requireMinRole,
};

export default userService;
