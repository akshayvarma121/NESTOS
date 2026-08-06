import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  try {
    await client.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_reminder_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        label TEXT NOT NULL,
        message TEXT NOT NULL,
        icon TEXT,
        enabled BOOLEAN NOT NULL DEFAULT true,
        schedule_type TEXT NOT NULL,
        interval_minutes INTEGER,
        daily_time TEXT,
        days_of_week INTEGER[],
        goal_id UUID REFERENCES pos_macro_goals(id) ON DELETE CASCADE,
        threshold_days_before INTEGER[],
        last_fired_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE pos_reminder_rules ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can manage their own reminder rules" ON pos_reminder_rules;
      CREATE POLICY "Users can manage their own reminder rules" 
        ON pos_reminder_rules 
        FOR ALL USING (auth.uid() = user_id);

      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log('Migration 7 (Add pos_reminder_rules) successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
