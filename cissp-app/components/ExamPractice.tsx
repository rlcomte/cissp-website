"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { examQuestions, EXAM_QUESTION_COUNT } from "@/lib/exam-questions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Trophy,
  XCircle,
} from "lucide-react";

const LEARNER_KEY = "cissp-exam-learner-v1";
const ACTIVE_ATTEMPT_KEY = "cissp-exam-active-v1";

type Answers = Record<string, number>;
type AttemptStatus = "in_progress" | "completed";
type View = "loading" | "dashboard" | "exam" | "result";

type AttemptSummary = {
  id: string;
  current_index: number;
  status: AttemptStatus;
  score: number;
  total: number;
  started_at: string;
};

function getOrCreateLearnerId() {
  const existing = localStorage.getItem(LEARNER_KEY);
  if (existing) return existing;
  const learnerId = crypto.randomUUID();
  localStorage.setItem(LEARNER_KEY, learnerId);
  return learnerId;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ExamPractice() {
  const [view, setView] = useState<View>("loading");
  const [learnerId, setLearnerId] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = useMemo(
    () =>
      examQuestions.reduce(
        (total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0),
        0,
      ),
    [answers],
  );
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = examQuestions[currentIndex];

  const loadHistory = useCallback(async (id: string) => {
    const response = await fetch(`/api/exams?learnerId=${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("history_failed");
    const data = await response.json();
    setHistory(Array.isArray(data.attempts) ? data.attempts : []);
  }, []);

  useEffect(() => {
    async function initialize() {
      const id = getOrCreateLearnerId();
      setLearnerId(id);
      try {
        await loadHistory(id);
        const activeAttemptId = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
        if (!activeAttemptId) {
          setView("dashboard");
          return;
        }
        const response = await fetch(
          `/api/exams?learnerId=${id}&attemptId=${activeAttemptId}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
          setView("dashboard");
          return;
        }
        const { attempt } = await response.json();
        setAttemptId(attempt.id);
        setStartedAt(attempt.started_at);
        setAnswers(attempt.answers ?? {});
        setCurrentIndex(attempt.current_index ?? 0);
        setView(attempt.status === "completed" ? "result" : "exam");
      } catch {
        setError("De database is niet bereikbaar. Controleer POSTGRES_URL of DATABASE_URL.");
        setView("dashboard");
      }
    }
    void initialize();
  }, [loadHistory]);

  const persistAttempt = useCallback(
    async (
      nextAnswers: Answers,
      nextIndex: number,
      status: AttemptStatus,
      id = attemptId,
      start = startedAt,
    ) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: id,
            learnerId,
            answers: nextAnswers,
            currentIndex: nextIndex,
            status,
            startedAt: start,
          }),
        });
        if (!response.ok) throw new Error("save_failed");
        return true;
      } catch {
        setError("Opslaan is mislukt. Probeer het opnieuw.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [attemptId, learnerId, startedAt],
  );

  async function startExam() {
    const id = crypto.randomUUID();
    const start = new Date().toISOString();
    if (!(await persistAttempt({}, 0, "in_progress", id, start))) return;
    setAttemptId(id);
    setStartedAt(start);
    setAnswers({});
    setCurrentIndex(0);
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, id);
    setView("exam");
  }

  async function selectAnswer(optionIndex: number) {
    const nextAnswers = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(nextAnswers);
    await persistAttempt(nextAnswers, currentIndex, "in_progress");
  }

  async function moveTo(index: number) {
    const nextIndex = Math.min(EXAM_QUESTION_COUNT - 1, Math.max(0, index));
    setCurrentIndex(nextIndex);
    await persistAttempt(answers, nextIndex, "in_progress");
  }

  async function finishExam() {
    if (answeredCount !== EXAM_QUESTION_COUNT) return;
    if (!(await persistAttempt(answers, currentIndex, "completed"))) return;
    localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    setView("result");
    await loadHistory(learnerId);
  }

  function returnToDashboard() {
    setView("dashboard");
    setAttemptId("");
    setStartedAt("");
    setAnswers({});
    setCurrentIndex(0);
  }

  if (view === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (view === "dashboard") {
    const completed = history.filter((attempt) => attempt.status === "completed");
    const bestScore = completed.length ? Math.max(...completed.map((attempt) => attempt.score)) : null;
    return (
      <div className="space-y-8">
        <section className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="font-mono text-[10px]">
            <ClipboardCheck className="mr-1 size-3" />
            40 vragen · 8 domeinen
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Oefentoets CISSP</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Oefen met theorievragen en realistische casussen. Iedere toets bevat vijf
            vragen per domein en je voortgang wordt na elk antwoord in de database opgeslagen.
          </p>
        </section>

        {error && <ErrorMessage text={error} />}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Omvang" value="40 vragen" text="Exact volgens de opdracht, verdeeld over alle kennisdomeinen." />
          <StatCard label="Vraagtypen" value="Theorie + casus" text="Kies steeds het beste antwoord uit vier mogelijkheden." />
          <StatCard label="Beste resultaat" value={bestScore === null ? "Nog geen" : `${bestScore}/40`} text="Na afloop krijg je uitleg en een score per domein." />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={startExam} disabled={saving || !learnerId}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
            Nieuwe oefentoets starten
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="size-3.5" />
            Automatisch opgeslagen
          </div>
        </div>

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recente pogingen</h2>
            <div className="grid gap-2">
              {history.map((attempt) => (
                <Card key={attempt.id} className="py-0">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">{formatDate(attempt.started_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.status === "completed" ? "Afgerond" : `Bezig, vraag ${attempt.current_index + 1}`}
                      </p>
                    </div>
                    <Badge variant={attempt.status === "completed" ? "secondary" : "outline"}>
                      {attempt.status === "completed" ? `${attempt.score}/${attempt.total}` : "Open"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (view === "result") {
    const domainScores = Array.from({ length: 8 }, (_, offset) => {
      const domain = offset + 1;
      const questions = examQuestions.filter((question) => question.domain === domain);
      return {
        domain,
        score: questions.filter((question) => answers[question.id] === question.correctIndex).length,
        total: questions.length,
      };
    });
    const percentage = Math.round((score / EXAM_QUESTION_COUNT) * 100);

    return (
      <div className="space-y-8">
        <Card className="glow-border">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
              <Trophy className="size-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eindscore</p>
              <h1 className="text-4xl font-bold">{score}/40</h1>
              <p className="mt-1 text-sm text-muted-foreground">{percentage}% correct</p>
            </div>
            <Progress value={percentage} className="h-2 max-w-sm" />
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={startExam} disabled={saving}>
                <RotateCcw className="size-4" />
                Nieuwe poging
              </Button>
              <Button variant="outline" onClick={returnToDashboard}>Overzicht</Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Resultaat per domein</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {domainScores.map((domain) => (
              <Card key={domain.domain}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Domein {domain.domain}</span>
                    <span className="font-mono text-sm">{domain.score}/{domain.total}</span>
                  </div>
                  <Progress value={(domain.score / domain.total) * 100} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Antwoorden en uitleg</h2>
          {examQuestions.map((question, index) => {
            const selected = answers[question.id];
            const correct = selected === question.correctIndex;
            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Vraag {index + 1}</Badge>
                    <Badge variant="outline">Domein {question.domain}</Badge>
                    <Badge variant="outline">{question.type === "case" ? "Casus" : "Theorie"}</Badge>
                    {correct ? <CheckCircle2 className="ml-auto size-5 text-success" /> : <XCircle className="ml-auto size-5 text-destructive" />}
                  </div>
                  <CardTitle className="text-base leading-relaxed">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {!correct && <p className="text-destructive">Jouw antwoord: {question.options[selected]}</p>}
                  <p className="text-success">Juiste antwoord: {question.options[question.correctIndex]}</p>
                  <p className="rounded-lg bg-secondary/60 p-3 text-muted-foreground">{question.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    );
  }

  const selectedAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === EXAM_QUESTION_COUNT - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Vraag {currentIndex + 1} van {EXAM_QUESTION_COUNT}</p>
            <h1 className="text-xl font-semibold">Oefentoets CISSP</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saving ? <><Loader2 className="size-3.5 animate-spin" />Opslaan</> : <><Save className="size-3.5" />Opgeslagen</>}
          </div>
        </div>
        <Progress value={(answeredCount / EXAM_QUESTION_COUNT) * 100} className="h-2" />
        {error && <ErrorMessage text={error} />}

        <Card className="glow-border">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Domein {currentQuestion.domain}</Badge>
              <Badge variant="outline">{currentQuestion.type === "case" ? "Casusvraag" : "Theorievraag"}</Badge>
            </div>
            <CardTitle className="pt-2 text-lg leading-relaxed sm:text-xl">{currentQuestion.question}</CardTitle>
            <CardDescription>Kies het beste antwoord.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {currentQuestion.options.map((option, optionIndex) => (
              <button
                key={option}
                type="button"
                disabled={saving}
                onClick={() => void selectAnswer(optionIndex)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left text-sm leading-relaxed transition-colors",
                  "disabled:cursor-wait disabled:opacity-70",
                  selectedAnswer === optionIndex
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-foreground/30 hover:bg-secondary/40",
                )}
              >
                <span className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                  selectedAnswer === optionIndex && "border-primary bg-primary text-primary-foreground",
                )}>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => void moveTo(currentIndex - 1)} disabled={currentIndex === 0 || saving}>
            <ArrowLeft className="size-4" />Vorige
          </Button>
          {isLastQuestion ? (
            <Button onClick={finishExam} disabled={answeredCount !== EXAM_QUESTION_COUNT || saving}>
              Toets afronden<CheckCircle2 className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => void moveTo(currentIndex + 1)} disabled={selectedAnswer === undefined || saving}>
              Volgende<ArrowRight className="size-4" />
            </Button>
          )}
        </div>
        {isLastQuestion && answeredCount !== EXAM_QUESTION_COUNT && (
          <p className="text-right text-xs text-muted-foreground">
            Beantwoord nog {EXAM_QUESTION_COUNT - answeredCount} vraag of vragen.
          </p>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Voortgang</CardTitle>
            <CardDescription>{answeredCount}/40 beantwoord</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-5">
              {examQuestions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => void moveTo(index)}
                  disabled={saving}
                  aria-label={`Ga naar vraag ${index + 1}`}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border text-xs transition-colors",
                    index === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    answers[question.id] !== undefined ? "border-primary/40 bg-primary/15" : "border-border hover:bg-secondary",
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" className="w-full" onClick={() => void persistAttempt(answers, currentIndex, "in_progress")} disabled={saving}>
          <RefreshCw className="size-4" />Opnieuw opslaan
        </Button>
      </aside>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {text}
    </div>
  );
}

function StatCard({ label, value, text }: { label: string; value: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
