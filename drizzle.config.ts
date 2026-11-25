import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      "postgresql://crm:crm_password_segura@localhost:5432/crm_db",
  },
});
