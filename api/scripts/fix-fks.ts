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
ALTER TABLE pos_routines 
ADD CONSTRAINT pos_routines_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES pos_user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE pos_routines 
ADD CONSTRAINT pos_routines_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES pos_user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE pos_routine_logs
ADD CONSTRAINT pos_routine_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES pos_user_profiles(user_id) ON DELETE CASCADE;
`;

async function addFks() {
  try {
    await client.connect();
    console.log("Applying foreign keys...");
    await client.query(schema);
    console.log("Foreign keys applied successfully.");
    
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

addFks();
