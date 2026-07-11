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
CREATE TABLE IF NOT EXISTS pos_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  time_label TEXT,
  days_of_week TEXT[] NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_routine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES pos_routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 8 schema (Routines)...");
    await client.query(schema);
    console.log("Phase 8 Schema applied successfully.");
    
    // Attempt to notify Supabase PostgREST to reload schema
    try {
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log("Notified PostgREST to reload schema cache.");
    } catch (e) {
      console.log("Note: Could not notify PostgREST automatically.");
    }
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
