import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATION_FILES = [
  '001_extensions.sql',
  '002_initial_schema.sql',
  '003_matching_functions.sql',
];

export async function runMigrations() {
  const client = await pool.connect();
  try {
    for (const file of MIGRATION_FILES) {
      const sql = readFileSync(
        join(__dirname, 'migrations', file),
        'utf-8',
      );
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      console.log(`✓ ${file}`);
    }
    console.log('All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

export async function runSeed() {
  const client = await pool.connect();
  try {
    const sql = readFileSync(
      join(__dirname, 'migrations', '004_seed.sql'),
      'utf-8',
    );
    console.log('Running seed...');
    await client.query(sql);
    console.log('✓ Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}
