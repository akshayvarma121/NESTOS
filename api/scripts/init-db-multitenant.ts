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
-- Drop existing single-tenant tables
DROP TABLE IF EXISTS pos_vault_entries;
DROP TABLE IF EXISTS pos_vault_security;
DROP TABLE IF EXISTS pos_settings;
DROP TABLE IF EXISTS pos_push_subscriptions;
DROP TABLE IF EXISTS pos_nudges;
DROP TABLE IF EXISTS pos_partner_link;
DROP TABLE IF EXISTS pos_content_capture;
DROP TABLE IF EXISTS pos_opportunities;
DROP TABLE IF EXISTS pos_daily_closeouts;
DROP TABLE IF EXISTS pos_micro_tasks;
DROP TABLE IF EXISTS pos_macro_goals;
DROP TYPE IF EXISTS capture_tag;

CREATE TYPE capture_tag AS ENUM ('dsa_win', 'dev_milestone', 'random');

-- Create new Multi-Tenant Tables

CREATE TABLE pos_user_profiles (
  user_id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
  username TEXT UNIQUE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  partner_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

CREATE TABLE pos_macro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  total_units INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_micro_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  macro_id UUID NOT NULL REFERENCES pos_macro_goals(id),
  title TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_daily_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  date DATE UNIQUE NOT NULL,
  total_scheduled INT NOT NULL,
  total_completed INT NOT NULL,
  rollover_count INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved',
  deadline TIMESTAMPTZ,
  notes TEXT,
  alerted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_content_capture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  raw_text TEXT NOT NULL,
  tag capture_tag NOT NULL,
  linked_macro_id UUID REFERENCES pos_macro_goals(id),
  posted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  receiver_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'sent'
);

CREATE TABLE pos_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pos_settings (
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

CREATE TABLE pos_vault_security (
  user_id UUID PRIMARY KEY REFERENCES pos_user_profiles(user_id),
  salt TEXT NOT NULL,
  pin_verify_hash TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);

CREATE TABLE pos_vault_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pos_user_profiles(user_id),
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function initDb() {
  try {
    await client.connect();
    console.log("Connected to database. Applying Multi-Tenant schema...");
    await client.query(schema);
    console.log("Multi-Tenant Schema applied successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

initDb();
