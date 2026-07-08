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
CREATE TABLE IF NOT EXISTS pos_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add alerted column to pos_opportunities if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='pos_opportunities' AND column_name='alerted') THEN
        ALTER TABLE pos_opportunities ADD COLUMN alerted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END
$$;

-- Global settings table
CREATE TABLE IF NOT EXISTS pos_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default morning briefing time
INSERT INTO pos_settings (key, value) VALUES ('morning_briefing_time', '07:00')
ON CONFLICT (key) DO NOTHING;
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 6 schema...");
    await client.query(schema);
    console.log("Phase 6 Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
