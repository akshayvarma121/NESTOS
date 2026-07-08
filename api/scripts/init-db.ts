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

const client = new Client({
  connectionString,
});

const schema = `
DO $$ BEGIN
    CREATE TYPE goal_category AS ENUM ('academic', 'dsa', 'dev', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'done', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS pos_macro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category goal_category NOT NULL,
  total_units INT NOT NULL,
  unit_label TEXT NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status goal_status NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS pos_micro_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_id UUID NOT NULL REFERENCES pos_macro_goals(id) ON DELETE CASCADE,
  unit_number INT NOT NULL,
  title TEXT NOT NULL,
  scheduled_date DATE,
  status task_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying schema...");
    await client.query(schema);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
