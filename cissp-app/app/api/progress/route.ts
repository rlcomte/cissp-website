import { NextResponse, type NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IDS = 2000;

type ProgressPayload = {
  known: number[];
  favorites: number[];
};

function sanitizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  for (const item of value) {
    if (Number.isInteger(item) && (item as number) >= 0) {
      seen.add(item as number);
      if (seen.size >= MAX_IDS) break;
    }
  }
  return [...seen];
}

function sanitizePayload(body: unknown): ProgressPayload {
  const obj = (body ?? {}) as Record<string, unknown>;
  return {
    known: sanitizeIds(obj.known),
    favorites: sanitizeIds(obj.favorites),
  };
}

const CODE_RE = /^\d{4}$/;

// Load progress for a given 4-digit code.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  await ensureSchema();
  const rows = await sql<{ data: ProgressPayload }[]>`
    select data from progress_codes where code = ${code}
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = rows[0].data ?? { known: [], favorites: [] };
  return NextResponse.json({
    code,
    known: Array.isArray(data.known) ? data.known : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
  });
}

// Save progress. Reuses the supplied code if present, otherwise mints a fresh one.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data = sanitizePayload(body);
  const requestedCode = (body as Record<string, unknown>)?.code;
  await ensureSchema();

  // Update in place when the client already owns a code.
  if (typeof requestedCode === "string" && CODE_RE.test(requestedCode)) {
    const updated = await sql<{ code: string }[]>`
      insert into progress_codes (code, data, updated_at)
      values (${requestedCode}, ${sql.json(data)}, now())
      on conflict (code) do update
        set data = excluded.data, updated_at = now()
      returning code
    `;
    return NextResponse.json({ code: updated[0].code });
  }

  // Otherwise mint a unique 4-digit code (1000–9999, no leading-zero ambiguity).
  for (let attempt = 0; attempt < 16; attempt++) {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    const inserted = await sql<{ code: string }[]>`
      insert into progress_codes (code, data)
      values (${code}, ${sql.json(data)})
      on conflict (code) do nothing
      returning code
    `;
    if (inserted.length > 0) {
      return NextResponse.json({ code: inserted[0].code });
    }
  }

  return NextResponse.json({ error: "no_code_available" }, { status: 503 });
}
