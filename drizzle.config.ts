import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.log("Cannot find database url in .env file");
}

export default defineConfig({
  out: "./migrations",
  // schema: "./migrations/schema.ts",
  schema: ["./src/lib/supabase/schema.ts", "./migrations/schema.ts"],
  dialect: "postgresql",
  //   driver: "pg",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
