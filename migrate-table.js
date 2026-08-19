import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log("Connected to DB");
  
  await client.query(`
    ALTER TABLE file_deltas DROP CONSTRAINT IF EXISTS file_deltas_file_id_fkey;
  `);
  
  console.log("Constraint dropped.");
  await client.end();
}

run().catch(console.error);
