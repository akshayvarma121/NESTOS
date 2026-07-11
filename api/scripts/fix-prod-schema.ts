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
-- Create pos_notes table
CREATE TABLE IF NOT EXISTS pos_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add explicit foreign key for pos_notes so postgrest routing works
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_notes_user_id_fkey') THEN
    ALTER TABLE pos_notes 
    ADD CONSTRAINT pos_notes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES pos_user_profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add assigned_to to pos_micro_tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_micro_tasks' AND column_name='assigned_to') THEN
    ALTER TABLE pos_micro_tasks ADD COLUMN assigned_to UUID;
  END IF;
END $$;

-- Add foreign key for assigned_to
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_micro_tasks_assigned_to_fkey') THEN
    ALTER TABLE pos_micro_tasks 
    ADD CONSTRAINT pos_micro_tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES pos_user_profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;
`;

async function fixSchema() {
  try {
    await client.connect();
    console.log("Applying schema fixes...");
    await client.query(schema);
    console.log("Schema fixes applied successfully.");
    
    try {
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log("Notified PostgREST to reload schema cache.");
    } catch (e) {
      console.log("Note: Could not notify PostgREST automatically.");
    }
  } catch (err) {
    console.error("Error applying schema fixes:", err);
  } finally {
    await client.end();
  }
}

fixSchema();
