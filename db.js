import pg from 'pg';
import { config } from './config/env.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: config.pg.host,
      port: config.pg.port,
      user: config.pg.user,
      password: config.pg.password,
      database: config.pg.database,
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function connectToPostgres() {
  const client = await getPool().connect();
  console.log('Connected to PostgreSQL');
  return client;
}

export default connectToPostgres;
