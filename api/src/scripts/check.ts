import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkSchema() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'pos_user_profiles';
  `);
  console.log(res.rows);
  await client.end();
}
checkSchema();
