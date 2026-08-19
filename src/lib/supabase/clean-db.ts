import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const cleanDB = async () => {
  try {
    console.log("Cleaning database...");
    const client = postgres(process.env.DATABASE_URL as string);
    await client`DROP SCHEMA IF EXISTS public CASCADE;`;
    await client`DROP SCHEMA IF EXISTS drizzle CASCADE;`;
    await client`CREATE SCHEMA public;`;
    await client`GRANT ALL ON SCHEMA public TO postgres;`;
    await client`GRANT ALL ON SCHEMA public TO public;`;
    console.log("Successfully cleaned DB");
    process.exit(0);
  } catch (error) {
    console.log("Error cleaning DB: ", error);
    process.exit(1);
  }
};
cleanDB();
