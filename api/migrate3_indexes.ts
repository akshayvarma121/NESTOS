import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_id_deadlines ON pos_deadlines(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_id_captures ON pos_simple_captures(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_id_todos ON pos_personal_todos(user_id);
      CREATE INDEX IF NOT EXISTS idx_created_at_captures ON pos_simple_captures(created_at);
      CREATE INDEX IF NOT EXISTS idx_created_at_todos ON pos_personal_todos(created_at);
    `);
    console.log('Migration 3 (Indexes) successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
