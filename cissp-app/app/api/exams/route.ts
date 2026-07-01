import { NextResponse, type NextRequest } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { calculateExamScore, examQuestions, EXAM_QUESTION_COUNT } from "@/lib/exam-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validQuestionIds = new Set(examQuestions.map((question) => question.id));

type AttemptPayload = {
  attemptId: string;
  learnerId: string;
  answers: Record<string, number>;
  currentIndex: number;
  status: "in_progress" | "completed";
  startedAt: string;
};

function sanitizeAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, number> = {};
  for (const [questionId, answer] of Object.entries(value)) {
    if (validQuestionIds.has(questionId) && Number.isInteger(answer) && answer >= 0 && answer <= 3) {
      answers[questionId] = answer;
    }
  }
  return answers;
}

function parsePayload(body: unknown): AttemptPayload | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (
    typeof value.attemptId !== "string" ||
    !UUID_RE.test(value.attemptId) ||
    typeof value.learnerId !== "string" ||
    !UUID_RE.test(value.learnerId) ||
    (value.status !== "in_progress" && value.status !== "completed") ||
    typeof value.startedAt !== "string" ||
    Number.isNaN(Date.parse(value.startedAt))
  ) {
    return null;
  }
  const answers = sanitizeAnswers(value.answers);
  const currentIndex = Math.min(
    EXAM_QUESTION_COUNT - 1,
    Math.max(0, Number.isInteger(value.currentIndex) ? (value.currentIndex as number) : 0),
  );
  return {
    attemptId: value.attemptId,
    learnerId: value.learnerId,
    answers,
    currentIndex,
    status: value.status,
    startedAt: value.startedAt,
  };
}

export async function GET(req: NextRequest) {
  const learnerId = req.nextUrl.searchParams.get("learnerId") ?? "";
  const attemptId = req.nextUrl.searchParams.get("attemptId");
  if (!UUID_RE.test(learnerId) || (attemptId !== null && !UUID_RE.test(attemptId))) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  await ensureSchema();
  const sql = getSql();

  if (attemptId) {
    const rows = await sql`
      select id, learner_id, answers, current_index, status, score, total,
             started_at, completed_at, updated_at
      from exam_attempts
      where id = ${attemptId} and learner_id = ${learnerId}
      limit 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ attempt: rows[0] });
  }

  const rows = await sql`
    select id, current_index, status, score, total, started_at, completed_at, updated_at
    from exam_attempts
    where learner_id = ${learnerId}
    order by updated_at desc
    limit 10
  `;
  return NextResponse.json({ attempts: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "invalid_attempt" }, { status: 400 });
  }

  const score = calculateExamScore(payload.answers);
  const completedAt = payload.status === "completed" ? new Date() : null;
  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    insert into exam_attempts (
      id, learner_id, answers, current_index, status, score, total, started_at, completed_at, updated_at
    )
    values (
      ${payload.attemptId},
      ${payload.learnerId},
      ${sql.json(payload.answers)},
      ${payload.currentIndex},
      ${payload.status},
      ${score},
      ${EXAM_QUESTION_COUNT},
      ${payload.startedAt},
      ${completedAt},
      now()
    )
    on conflict (id) do update set
      answers = excluded.answers,
      current_index = excluded.current_index,
      status = excluded.status,
      score = excluded.score,
      completed_at = case
        when exam_attempts.completed_at is not null then exam_attempts.completed_at
        else excluded.completed_at
      end,
      updated_at = now()
    where exam_attempts.learner_id = excluded.learner_id
    returning id, current_index, status, score, total, started_at, completed_at, updated_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_owner_mismatch" }, { status: 409 });
  }
  return NextResponse.json({ attempt: rows[0] });
}
