import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isLocalHost = (() => {
  try {
    const url = new URL(databaseUrl);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
})();

const sslMode = process.env.DATABASE_SSL ?? process.env.PGSSLMODE;
const shouldUseSsl =
  (sslMode ? sslMode !== "disable" && sslMode !== "false" : false) ||
  (process.env.NODE_ENV === "production" && !isLocalHost);

export const pool = new Pool({
  connectionString: databaseUrl,
  ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const db = drizzle(pool, { schema });
