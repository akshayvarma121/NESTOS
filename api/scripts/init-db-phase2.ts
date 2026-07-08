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
ALTER TABLE pos_micro_tasks ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS pos_daily_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  tasks_planned INT NOT NULL,
  tasks_done INT NOT NULL,
  tasks_rolled_over INT NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 2 schema...");
    await client.query(schema);
    console.log("Phase 2 Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
