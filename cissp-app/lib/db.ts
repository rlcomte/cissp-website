import postgres from "postgres";

// Reuse the client across hot reloads / serverless invocations in the same process.
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

export function getSql() {
  if (globalForDb.__sql) return globalForDb.__sql;
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL (or DATABASE_URL) is not set");
  }
  const client = postgres(connectionString, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
  });
  globalForDb.__sql = client;
  return client;
}

let schemaReady: Promise<void> | null = null;

/** Lazily create the tables the first time an API route needs the database. */
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        create table if not exists progress_codes (
          code text primary key,
          data jsonb not null,
          updated_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists exam_attempts (
          id uuid primary key,
          learner_id uuid not null,
          answers jsonb not null default '{}'::jsonb,
          current_index integer not null default 0,
          status text not null default 'in_progress'
            check (status in ('in_progress', 'completed')),
          score integer not null default 0,
          total integer not null default 40,
          started_at timestamptz not null,
          completed_at timestamptz,
          updated_at timestamptz not null default now()
        )
      `;
      await sql`
        create index if not exists exam_attempts_learner_updated_idx
        on exam_attempts (learner_id, updated_at desc)
      `;
    })();
  }
  return schemaReady;
}
