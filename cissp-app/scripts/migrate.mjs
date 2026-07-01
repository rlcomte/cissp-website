import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.log("Database migration skipped: POSTGRES_URL or DATABASE_URL is not set.");
  process.exit(0);
}

const sql = postgres(connectionString, {
  ssl: "require",
  max: 1,
  idle_timeout: 10,
  connect_timeout: 15,
});

try {
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(68477371)`;

    await transaction`
      create table if not exists progress_codes (
        code text primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )
    `;

    await transaction`
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

    await transaction`
      create index if not exists exam_attempts_learner_updated_idx
      on exam_attempts (learner_id, updated_at desc)
    `;
  });

  console.log("Database migration completed: progress_codes and exam_attempts are ready.");
} catch (error) {
  console.error("Database migration failed.");
  throw error;
} finally {
  await sql.end();
}
