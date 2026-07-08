import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_personal_todos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES pos_user_profiles(user_id) NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
