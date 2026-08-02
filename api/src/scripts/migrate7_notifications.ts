import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log("Starting Migration 7: Notifications Engine...");

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("No connection string found.");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Add last_notified_date to pos_routines
    await client.query(`ALTER TABLE pos_routines ADD COLUMN IF NOT EXISTS last_notified_date DATE;`);
    console.log("Added last_notified_date to pos_routines.");

    // 2. Add alerted to pos_macro_goals
    await client.query(`ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS alerted BOOLEAN DEFAULT false;`);
    console.log("Added alerted to pos_macro_goals.");

    // 3. Add alerted to pos_deadlines
    await client.query(`ALTER TABLE pos_deadlines ADD COLUMN IF NOT EXISTS alerted BOOLEAN DEFAULT false;`);
    console.log("Added alerted to pos_deadlines.");

    console.log("Migration 7 complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
