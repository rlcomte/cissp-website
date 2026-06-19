import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL (or DATABASE_URL) is not set");
}

// Reuse the client across hot reloads / serverless invocations in the same process.
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.__sql ??
  postgres(connectionString, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sql = sql;
}

let schemaReady: Promise<void> | null = null;

/** Lazily create the table the first time the API is hit. */
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      create table if not exists progress_codes (
        code text primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )
    `.then(() => undefined);
  }
  return schemaReady;
}
