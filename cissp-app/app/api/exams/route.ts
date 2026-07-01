import { NextResponse, type NextRequest } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import {
  calculateExamScore,
  examQuestions,
  EXAM_QUESTION_COUNT,
  PRACTICE_QUESTION_COUNT,
} from "@/lib/exam-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const questionById = new Map(examQuestions.map((question) => [question.id, question]));

type AttemptMode = "practice" | "exam";

type AttemptPayload = {
  attemptId: string;
  learnerId: string;
  mode: AttemptMode;
  questionOrder: string[];
  answers: Record<string, number>;
  currentIndex: number;
  status: "in_progress" | "completed";
  startedAt: string;
};

function sanitizeQuestionOrder(value: unknown, mode: AttemptMode) {
  if (!Array.isArray(value)) return null;
  const order = value.filter(
    (item): item is string => typeof item === "string" && questionById.has(item),
  );
  if (order.length !== value.length || new Set(order).size !== order.length) return null;

  const expectedLength = mode === "exam" ? EXAM_QUESTION_COUNT : PRACTICE_QUESTION_COUNT;
  if (order.length !== expectedLength) return null;

  if (mode === "exam") {
    for (let domain = 1; domain <= 8; domain++) {
      const count = order.filter((id) => questionById.get(id)?.domain === domain).length;
      if (count !== 5) return null;
    }
  } else {
    for (let domain = 1; domain <= 8; domain++) {
      const count = order.filter((id) => questionById.get(id)?.domain === domain).length;
      if (count !== 3) return null;
    }
  }
  return order;
}

function sanitizeAnswers(value: unknown, allowedIds: Set<string>) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, number> = {};
  for (const [questionId, answer] of Object.entries(value)) {
    if (allowedIds.has(questionId) && Number.isInteger(answer) && answer >= 0 && answer <= 3) {
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
    (value.mode !== "practice" && value.mode !== "exam") ||
    (value.status !== "in_progress" && value.status !== "completed") ||
    typeof value.startedAt !== "string" ||
    Number.isNaN(Date.parse(value.startedAt))
  ) {
    return null;
  }

  const questionOrder = sanitizeQuestionOrder(value.questionOrder, value.mode);
  if (!questionOrder) return null;
  const answers = sanitizeAnswers(value.answers, new Set(questionOrder));
  const currentIndex = Math.min(
    questionOrder.length - 1,
    Math.max(0, Number.isInteger(value.currentIndex) ? (value.currentIndex as number) : 0),
  );

  return {
    attemptId: value.attemptId,
    learnerId: value.learnerId,
    mode: value.mode,
    questionOrder,
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
      select id, learner_id, mode, question_order, answers, current_index, status,
             score, total, started_at, completed_at, updated_at
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
    select id, mode, current_index, status, score, total, started_at, completed_at, updated_at
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

  const score = calculateExamScore(payload.answers, payload.questionOrder);
  const completedAt = payload.status === "completed" ? new Date() : null;
  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    insert into exam_attempts (
      id, learner_id, mode, question_order, answers, current_index, status,
      score, total, started_at, completed_at, updated_at
    )
    values (
      ${payload.attemptId},
      ${payload.learnerId},
      ${payload.mode},
      ${sql.json(payload.questionOrder)},
      ${sql.json(payload.answers)},
      ${payload.currentIndex},
      ${payload.status},
      ${score},
      ${payload.questionOrder.length},
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
      and exam_attempts.mode = excluded.mode
      and exam_attempts.question_order = excluded.question_order
    returning id, mode, current_index, status, score, total, started_at, completed_at, updated_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_conflict" }, { status: 409 });
  }
  return NextResponse.json({ attempt: rows[0] });
}
