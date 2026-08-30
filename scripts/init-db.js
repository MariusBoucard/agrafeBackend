import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getPool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDb() {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const pool = getPool();
  await pool.query(schema);
  console.log('Database schema initialized.');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  initDb()
    .then(async () => {
      await getPool().end();
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
