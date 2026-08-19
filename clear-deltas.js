import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  await client.query("DELETE FROM file_deltas;");
  console.log("Cleared file_deltas");
  await client.end();
}

run().catch(console.error);
