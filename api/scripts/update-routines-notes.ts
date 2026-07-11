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
ALTER TABLE pos_routine_logs ADD COLUMN IF NOT EXISTS note TEXT;
`;

async function updateDb() {
  try {
    await client.connect();
    console.log("Connected to database. Updating schema (Adding note to routines)...");
    await client.query(schema);
    console.log("Schema updated successfully.");
    
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

updateDb();
