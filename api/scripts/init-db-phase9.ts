import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("No DIRECT_URL found in .env");
  process.exit(1);
}

const client = new Client({ connectionString });

const schema = `
CREATE TABLE IF NOT EXISTS pos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 9 schema (pos_events)...");
    await client.query(schema);
    console.log("Phase 9 Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
