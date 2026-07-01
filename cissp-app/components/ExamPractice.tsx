"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  examQuestions,
  GLOSSARY_QUESTION_COUNT,
  glossaryQuestions,
  type ExamQuestion,
} from "@/lib/exam-questions";
import { cn, shuffle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Database,
  Loader2,
  RotateCcw,
  Save,
  Trophy,
  XCircle,
} from "lucide-react";

const LEARNER_KEY = "cissp-exam-learner-v1";
const ACTIVE_ATTEMPT_KEY = "cissp-exam-active-v1";

type Answers = Record<string, number>;
type AttemptMode = "practice" | "exam";
type AttemptStatus = "in_progress" | "completed";
type View = "loading" | "dashboard" | "questions" | "result";

type AttemptSummary = {
  id: string;
  mode: AttemptMode;
  current_index: number;
  status: AttemptStatus;
  score: number;
  total: number;
  started_at: string;
};

const questionById = new Map(examQuestions.map((question) => [question.id, question]));
const glossaryIds = new Set(glossaryQuestions.map((question) => question.id));

function getOrCreateLearnerId() {
  const existing = localStorage.getItem(LEARNER_KEY);
  if (existing) return existing;
  const learnerId = crypto.randomUUID();
  localStorage.setItem(LEARNER_KEY, learnerId);
  return learnerId;
}

function buildQuestionOrder(mode: AttemptMode) {
  const selected: ExamQuestion[] = [];
  for (let domain = 1; domain <= 8; domain++) {
    const domainQuestions = examQuestions.filter((question) => question.domain === domain);
    const knowledge = domainQuestions.filter((question) => !glossaryIds.has(question.id));
    const terms = domainQuestions.filter((question) => glossaryIds.has(question.id));
    if (mode === "practice") {
      selected.push(...shuffle(knowledge).slice(0, 1), ...shuffle(terms).slice(0, 2));
    } else {
      selected.push(...shuffle(knowledge).slice(0, 3), ...shuffle(terms).slice(0, 2));
    }
  }
  return shuffle(selected).map((question) => question.id);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ExamPractice() {
  const [view, setView] = useState<View>("loading");
  const [learnerId, setLearnerId] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [mode, setMode] = useState<AttemptMode>("exam");
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeQuestions = useMemo(
    () =>
      questionOrder
        .map((questionId) => questionById.get(questionId))
        .filter((question): question is ExamQuestion => Boolean(question)),
    [questionOrder],
  );
  const currentQuestion = activeQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(
    () =>
      activeQuestions.reduce(
        (total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0),
        0,
      ),
    [activeQuestions, answers],
  );

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
        const activeId = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
        if (!activeId) {
          setView("dashboard");
          return;
        }
        const response = await fetch(`/api/exams?learnerId=${id}&attemptId=${activeId}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("attempt_failed");
        const { attempt } = await response.json();
        if (!Array.isArray(attempt.question_order) || attempt.question_order.length === 0) {
          localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
          setView("dashboard");
          return;
        }
        setAttemptId(attempt.id);
        setStartedAt(attempt.started_at);
        setMode(attempt.mode === "practice" ? "practice" : "exam");
        setQuestionOrder(attempt.question_order);
        setAnswers(attempt.answers ?? {});
        setCurrentIndex(attempt.current_index ?? 0);
        setView(attempt.status === "completed" ? "result" : "questions");
      } catch {
        localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
        setError("De database is niet bereikbaar of de poging kon niet worden geladen.");
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
      values?: {
        id: string;
        start: string;
        attemptMode: AttemptMode;
        order: string[];
      },
    ) => {
      const target = values ?? {
        id: attemptId,
        start: startedAt,
        attemptMode: mode,
        order: questionOrder,
      };
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: target.id,
            learnerId,
            mode: target.attemptMode,
            questionOrder: target.order,
            answers: nextAnswers,
            currentIndex: nextIndex,
            status,
            startedAt: target.start,
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
    [attemptId, learnerId, mode, questionOrder, startedAt],
  );

  async function startAttempt(attemptMode: AttemptMode) {
    const id = crypto.randomUUID();
    const start = new Date().toISOString();
    const order = buildQuestionOrder(attemptMode);
    const values = { id, start, attemptMode, order };
    if (!(await persistAttempt({}, 0, "in_progress", values))) return;
    setAttemptId(id);
    setStartedAt(start);
    setMode(attemptMode);
    setQuestionOrder(order);
    setAnswers({});
    setCurrentIndex(0);
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, id);
    setView("questions");
  }

  async function selectAnswer(optionIndex: number) {
    if (!currentQuestion || (mode === "practice" && answers[currentQuestion.id] !== undefined)) {
      return;
    }
    const nextAnswers = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(nextAnswers);
    await persistAttempt(nextAnswers, currentIndex, "in_progress");
  }

  async function moveTo(index: number) {
    const nextIndex = Math.min(activeQuestions.length - 1, Math.max(0, index));
    setCurrentIndex(nextIndex);
    await persistAttempt(answers, nextIndex, "in_progress");
  }

  async function finishAttempt() {
    if (answeredCount !== activeQuestions.length) return;
    if (!(await persistAttempt(answers, currentIndex, "completed"))) return;
    localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    setView("result");
    await loadHistory(learnerId);
  }

  function showDashboard() {
    setView("dashboard");
    setError(null);
  }

  if (view === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (view === "dashboard") {
    const completedExams = history.filter(
      (attempt) => attempt.mode === "exam" && attempt.status === "completed",
    );
    const bestScore = completedExams.length
      ? Math.max(...completedExams.map((attempt) => attempt.score))
      : null;

    return (
      <div className="space-y-8">
        <section className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {examQuestions.length} vragen · {GLOSSARY_QUESTION_COUNT} begrippen
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CISSP oefenen en toetsen
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Kies directe feedback tijdens het oefenen of maak een volledige toets van
            40 vragen. Beide modi gebruiken theorie, casussen en de 400 begrippen.
          </p>
        </section>

        {error && <ErrorMessage text={error} />}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glow-border">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <BookOpenCheck className="size-5" />
              </div>
              <CardTitle>Modus oefenen</CardTitle>
              <CardDescription>
                Je ziet na ieder antwoord direct of het goed is, inclusief het juiste
                antwoord en de uitleg.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void startAttempt("practice")} disabled={saving}>
                Oefenen starten
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glow-border">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <ClipboardCheck className="size-5" />
              </div>
              <CardTitle>Volledige toets</CardTitle>
              <CardDescription>
                40 willekeurige vragen, vijf per domein. Antwoorden en uitleg worden
                pas na afronding getoond.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void startAttempt("exam")} disabled={saving}>
                Toets starten
                <ArrowRight className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Beste score: {bestScore === null ? "nog geen" : `${bestScore}/40`}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="size-3.5" />
          Antwoorden worden na iedere keuze opgeslagen
        </div>

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recente pogingen</h2>
            <div className="grid gap-2">
              {history.map((attempt) => (
                <Card key={attempt.id} className="py-0">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.mode === "practice" ? "Oefenen" : "Volledige toets"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attempt.started_at)} ·{" "}
                        {attempt.status === "completed"
                          ? "afgerond"
                          : `bezig bij vraag ${attempt.current_index + 1}`}
                      </p>
                    </div>
                    <Badge variant={attempt.status === "completed" ? "secondary" : "outline"}>
                      {attempt.status === "completed"
                        ? `${attempt.score}/${attempt.total}`
                        : "Open"}
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
    const percentage = activeQuestions.length
      ? Math.round((score / activeQuestions.length) * 100)
      : 0;
    const domainScores = Array.from({ length: 8 }, (_, offset) => {
      const domain = offset + 1;
      const questions = activeQuestions.filter((question) => question.domain === domain);
      return {
        domain,
        score: questions.filter((question) => answers[question.id] === question.correctIndex).length,
        total: questions.length,
      };
    });

    return (
      <div className="space-y-8">
        <Card className="glow-border">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <Trophy className="size-12" />
            <div>
              <p className="text-sm text-muted-foreground">
                {mode === "practice" ? "Oefenresultaat" : "Toetsresultaat"}
              </p>
              <h1 className="text-4xl font-bold">
                {score}/{activeQuestions.length}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{percentage}% correct</p>
            </div>
            <Progress value={percentage} className="h-2 max-w-sm" />
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => void startAttempt(mode)} disabled={saving}>
                <RotateCcw className="size-4" />
                Opnieuw
              </Button>
              <Button variant="outline" onClick={showDashboard}>Overzicht</Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Resultaat per domein</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {domainScores.map((domain) => (
              <Card key={domain.domain}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Domein {domain.domain}</span>
                    <span className="font-mono">{domain.score}/{domain.total}</span>
                  </div>
                  <Progress value={domain.total ? (domain.score / domain.total) * 100 : 0} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {mode === "exam" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Antwoorden en uitleg</h2>
            {activeQuestions.map((question, index) => (
              <AnswerReview
                key={question.id}
                question={question}
                index={index}
                selected={answers[question.id]}
              />
            ))}
          </section>
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selectedAnswer = answers[currentQuestion.id];
  const showFeedback = mode === "practice" && selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
  const isLastQuestion = currentIndex === activeQuestions.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="secondary" className="mb-2">
              {mode === "practice" ? "Oefenen · directe feedback" : "Toets · feedback na afloop"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Vraag {currentIndex + 1} van {activeQuestions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? "Opslaan" : "Opgeslagen"}
          </div>
        </div>

        <Progress value={(answeredCount / activeQuestions.length) * 100} className="h-2" />
        {error && <ErrorMessage text={error} />}

        <Card className="glow-border">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Domein {currentQuestion.domain}</Badge>
              <Badge variant="outline">
                {currentQuestion.id.startsWith("term-")
                  ? "Begrip"
                  : currentQuestion.type === "case"
                    ? "Casus"
                    : "Theorie"}
              </Badge>
            </div>
            <CardTitle className="pt-2 text-lg leading-relaxed sm:text-xl">
              {currentQuestion.question}
            </CardTitle>
            <CardDescription>Kies het beste antwoord.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {currentQuestion.options.map((option, optionIndex) => {
              const optionIsCorrect = optionIndex === currentQuestion.correctIndex;
              const optionIsSelected = optionIndex === selectedAnswer;
              return (
                <button
                  key={`${optionIndex}-${option}`}
                  type="button"
                  disabled={saving || showFeedback}
                  onClick={() => void selectAnswer(optionIndex)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left text-sm leading-relaxed transition-colors",
                    !showFeedback && optionIsSelected && "border-primary bg-primary/10",
                    !showFeedback && !optionIsSelected && "hover:border-foreground/30 hover:bg-secondary/40",
                    showFeedback && optionIsCorrect && "border-success/50 bg-success/10",
                    showFeedback && optionIsSelected && !optionIsCorrect && "border-destructive/50 bg-destructive/10",
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  {option}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {showFeedback && (
          <Card className={isCorrect ? "border-success/40" : "border-destructive/40"}>
            <CardContent className="space-y-2 p-4">
              <p className={cn("flex items-center gap-2 font-medium", isCorrect ? "text-success" : "text-destructive")}>
                {isCorrect ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                {isCorrect ? "Goed beantwoord" : "Niet goed"}
              </p>
              {!isCorrect && (
                <p className="text-sm">
                  Juiste antwoord: {currentQuestion.options[currentQuestion.correctIndex]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => void moveTo(currentIndex - 1)}
            disabled={currentIndex === 0 || saving}
          >
            <ArrowLeft className="size-4" />
            Vorige
          </Button>
          {isLastQuestion ? (
            <Button onClick={finishAttempt} disabled={answeredCount !== activeQuestions.length || saving}>
              Afronden
              <CheckCircle2 className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void moveTo(currentIndex + 1)}
              disabled={selectedAnswer === undefined || saving}
            >
              Volgende
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Voortgang</CardTitle>
            <CardDescription>{answeredCount}/{activeQuestions.length} beantwoord</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "exam" ? (
              <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-5">
                {activeQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => void moveTo(index)}
                    disabled={saving}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border text-xs",
                      index === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      answers[question.id] !== undefined ? "border-primary/40 bg-primary/15" : "border-border",
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Goed: <span className="font-mono text-success">{score}</span></p>
                <p>Nog te oefenen: <span className="font-mono">{activeQuestions.length - answeredCount}</span></p>
                <p>Inclusief alle {GLOSSARY_QUESTION_COUNT} begrippen.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Button variant="outline" className="w-full" onClick={showDashboard}>
          Terug naar overzicht
        </Button>
      </aside>
    </div>
  );
}

function AnswerReview({
  question,
  index,
  selected,
}: {
  question: ExamQuestion;
  index: number;
  selected: number;
}) {
  const correct = selected === question.correctIndex;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Vraag {index + 1}</Badge>
          <Badge variant="outline">Domein {question.domain}</Badge>
          {correct
            ? <CheckCircle2 className="ml-auto size-5 text-success" />
            : <XCircle className="ml-auto size-5 text-destructive" />}
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
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {text}
    </div>
  );
}
