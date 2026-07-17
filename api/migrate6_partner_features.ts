import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ffbmvggacssmaporyxiq.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Cannot run migration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("Starting migration...");
  const { error } = await supabase.rpc("exec_sql", { sql_string: "ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS visibility VARCHAR DEFAULT 'shared'; ALTER TABLE pos_macro_goals ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);" });
  console.log("Error:", error);
}

runMigration();