import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE pos_micro_tasks ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('Migration 4 (Add description to pos_micro_tasks) successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
