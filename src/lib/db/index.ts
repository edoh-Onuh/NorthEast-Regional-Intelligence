import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __dbClient: postgres.Sql | undefined;
  var __drizzleDb: PostgresJsDatabase<typeof schema> | undefined;
}

/**
 * Lazily constructs the Postgres connection on first real query rather than
 * at module import time. This matters because `db` is imported transitively
 * by the home page, and we want a missing/unreachable DATABASE_URL to
 * surface as a caught error inside that page's data-fetching function (which
 * renders a friendly setup notice) — not as an import-time crash during
 * `next build`'s static analysis or during server startup.
 */
function createDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision a Postgres database (Vercel Postgres / Neon) and set DATABASE_URL in your environment."
    );
  }
  // Reused across warm serverless invocations (and dev hot-reloads) via
  // `global` so we don't open a fresh connection pool on every request.
  const client =
    global.__dbClient ??
    postgres(url, {
      max: 1,
      idle_timeout: 20,
      ssl: "require",
    });
  global.__dbClient = client;
  return drizzle(client, { schema });
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!global.__drizzleDb) {
    global.__drizzleDb = createDb();
  }
  return global.__drizzleDb;
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

export { schema };
