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
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pos_routine_logs' AND column_name='status') THEN
    ALTER TABLE pos_routine_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'done';
  END IF;
END $$;
`;

async function run() {
  try {
    await client.connect();
    console.log("Applying routine status migration...");
    await client.query(schema);
    console.log("Migration successful.");
    
    try {
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log("Notified PostgREST to reload schema cache.");
    } catch (e) {
      console.log("Note: Could not notify PostgREST automatically.");
    }
  } catch (err) {
    console.error("Error applying migration:", err);
  } finally {
    await client.end();
  }
}

run();
