import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS deadline DATE;
      ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT 'unit';
      
      -- We need to notify PostgREST to reload its schema cache. 
      -- In Supabase, this happens automatically after some time, or we can force it 
      -- by calling NOTIFY pgrst, 'reload schema'
      NOTIFY pgrst, 'reload schema';
    `);
    console.log('Migration 5 (Add deadline and unit_label to pos_macro_goals) successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
