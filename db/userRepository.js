import { config } from '../config/env.js';
import { query } from '../db.js';
import fs from 'fs';

function readDataFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('data/user.json', 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}

function saveToFile(data) {
  fs.writeFileSync('data/user.json', JSON.stringify(data, null, 2));
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    mail: row.mail,
    type: row.role,
    role: row.role,
    profile_slug: row.profile_slug,
    bio: row.bio,
    avatar: row.avatar,
    mailCheck: row.mail_check,
  };
}

export async function pgGetUserById(id) {
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rowToUser(res.rows[0]);
}

export async function pgGetUserByMail(mail) {
  const res = await query('SELECT * FROM users WHERE mail = $1', [mail]);
  return res.rows[0] ? { ...res.rows[0], hash: res.rows[0].hash } : null;
}

export async function pgGetUserBySlug(slug) {
  const res = await query('SELECT id, name, mail, role, profile_slug, bio, avatar FROM users WHERE profile_slug = $1', [slug]);
  return rowToUser(res.rows[0]);
}

export async function pgGetAllUsers() {
  const res = await query('SELECT id, name, mail, role, profile_slug, bio, avatar FROM users ORDER BY name');
  return res.rows.map(rowToUser);
}

export async function pgInsertUser(user) {
  await query(
    `INSERT INTO users (id, name, mail, hash, role, profile_slug, bio, mail_check)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [user.id, user.name, user.mail, user.hash, user.role, user.profile_slug, user.bio || '', user.mailCheck ?? true]
  );
}

export async function pgUpdateUser(user) {
  await query(
    `UPDATE users
     SET name=$2, mail=$3, role=$4, profile_slug=$5, bio=$6, hash=COALESCE($7, hash)
     WHERE id=$1`,
    [user.id, user.name, user.mail, user.role, user.profile_slug, user.bio, user.hash ?? null]
  );
}

export async function pgDeleteUser(id) {
  const res = await query('DELETE FROM users WHERE id = $1', [id]);
  return res.rowCount > 0;
}

export function usePostgres() {
  return config.usePostgres;
}

export { readDataFromFile, saveToFile };
