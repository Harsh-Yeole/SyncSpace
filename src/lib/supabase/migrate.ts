import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
dotenv.config({ path: ".env" });

const migrateDB = async () => {
  try {
    console.log("Migrating client");
    const client = postgres(process.env.DATABASE_URL as string, { max: 1 });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("Successfully migrated");
    process.exit(0);
  } catch (error) {
    console.log("Error in migrating client: ", error);
    process.exit(1);
  }
};
migrateDB();
