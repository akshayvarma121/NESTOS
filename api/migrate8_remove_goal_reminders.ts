import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    
    await client.query(`
      ALTER TABLE pos_reminder_rules DROP COLUMN IF EXISTS goal_id;
      ALTER TABLE pos_reminder_rules DROP COLUMN IF EXISTS threshold_days_before;
      DELETE FROM pos_reminder_rules WHERE schedule_type = 'goalDeadline';
      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log('Migration 8 (Remove goal reminders from custom table) successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
