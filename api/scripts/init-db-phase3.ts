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
DO $$ BEGIN
    CREATE TYPE opportunity_stage AS ENUM ('to_apply', 'applied', 'oa', 'interview', 'offer', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS pos_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  source_link TEXT,
  notes TEXT,
  deadline TIMESTAMPTZ,
  stage opportunity_stage NOT NULL DEFAULT 'to_apply',
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Phase 3 schema...");
    await client.query(schema);
    console.log("Phase 3 Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
