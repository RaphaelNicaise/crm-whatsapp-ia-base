import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Obtiene la URL de la base de datos PostgreSQL.
 */
export function urlPostgres(env: Record<string, string | undefined> = process.env): string {
  return (
    env.DATABASE_URL ||
    env.SUPABASE_DB_URL ||
    "postgresql://crm:crm_password_segura@localhost:5432/crm_db"
  );
}

const url = urlPostgres();
const preparadas = !/:6543\//.test(url);
const ssl =
  /sslmode=disable/i.test(url) ||
  /@(localhost|127\.0\.0\.1|postgres|db|host\.docker\.internal)[:/]/.test(url)
    ? false
    : "require";

// Cliente de postgres.js
export const sqlClient = postgres(url, {
  prepare: preparadas,
  max: 5,
  idle_timeout: 0,
  connect_timeout: 10,
  ssl,
  onnotice: () => {},
});

// Instancia de Drizzle ORM con todo el schema tipeado
export const db = drizzle(sqlClient, { schema });

export * from "./schema";
