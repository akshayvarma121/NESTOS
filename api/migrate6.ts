
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to PG.');
  await client.query('ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS visibility VARCHAR DEFAULT \'shared\'');
  await client.query('ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id)');
  console.log('Done DB migration.');
  await client.end();
}
run().catch(console.error);

