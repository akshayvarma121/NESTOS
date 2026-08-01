import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_focus_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES pos_user_profiles(user_id) NOT NULL,
        mode TEXT NOT NULL,
        duration_seconds INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Migration 7 successful');
  } catch (err) {
    console.error('Migration 7 failed:', err);
  } finally {
    await client.end();
  }
}

run();
