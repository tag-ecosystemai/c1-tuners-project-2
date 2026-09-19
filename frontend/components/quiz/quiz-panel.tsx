"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { generateQuiz } from "@/lib/api";
import { mockQuiz } from "@/lib/mock-data";
import type { Quiz } from "@/types";

type Phase = "confirm" | "loading" | "question" | "result";

export function QuizPanel({ courseId }: { courseId: string }) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const startQuiz = async () => {
    setPhase("loading");
    try {
      const data = await generateQuiz(courseId);
      setQuiz(data);
      setUsingMockData(false);
    } catch {
      setQuiz(mockQuiz);
      setUsingMockData(true);
    }
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setPhase("question");
  };

  const reset = () => {
    setPhase("confirm");
    setQuiz(null);
  };

  if (phase === "confirm") {
    return (
      <Card className="flex max-w-lg flex-col items-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-light">
          <ClipboardCheck className="h-5 w-5 text-forest" />
        </div>
        <h2 className="mt-4 font-serif text-xl text-ink">Ready for a quiz?</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          We&apos;ll generate a fresh set of questions from this course&apos;s materials.
        </p>
        <Button className="mt-5" onClick={startQuiz}>
          Generate Quiz
        </Button>
      </Card>
    );
  }

  if (phase === "loading") {
    return <p className="text-sm text-ink-muted">Generating quiz…</p>;
  }

  if (!quiz) return null;

  const question = quiz.questions[index];
  const isCorrect = selected === question?.correctOptionId;

  const submitAnswer = () => {
    if (!selected) return;
    setSubmitted(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const nextQuestion = () => {
    if (index + 1 < quiz.questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setPhase("result");
    }
  };

  if (phase === "result") {
    const total = quiz.questions.length;
    const isLowScore = correctCount / total < 0.6;
    return (
      <Card className="max-w-lg">
        {usingMockData && (
          <div className="mb-4 inline-block rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
            Sample quiz — backend not connected yet
          </div>
        )}
        <h2 className="font-serif text-2xl text-ink">Great work.</h2>
        <p className="mt-1 text-3xl font-medium text-forest">
          {correctCount}/{total}
        </p>
        {isLowScore && (
          <p className="mt-2 text-sm text-ink-muted">
            Worth another pass — retake the quiz to reinforce what you missed.
          </p>
        )}
        <Button className="mt-6" onClick={startQuiz}>
          Retake Quiz
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <div className="mb-3 flex items-center justify-between">
        {usingMockData && (
          <span className="rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
            Sample quiz — backend not connected yet
          </span>
        )}
        <button onClick={reset} className="ml-auto text-xs text-ink-muted hover:text-ink">
          Restart
        </button>
      </div>

      <p className="text-xs text-ink-muted">
        Question {index + 1} of {quiz.questions.length}
      </p>
      <ProgressBar className="mt-2" value={((index + (submitted ? 1 : 0)) / quiz.questions.length) * 100} />

      <h2 className="mt-5 font-serif text-xl text-ink">{question.prompt}</h2>

      <div className="mt-4 space-y-2">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          const showCorrect = submitted && opt.id === question.correctOptionId;
          const showWrong = submitted && isSelected && opt.id !== question.correctOptionId;

          return (
            <button
              key={opt.id}
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                showCorrect
                  ? "border-success bg-success/10 text-ink"
                  : showWrong
                  ? "border-danger bg-danger/10 text-ink"
                  : isSelected
                  ? "border-forest bg-forest-light text-ink"
                  : "border-border bg-cream text-ink hover:bg-forest-light"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="mt-4 rounded-xl bg-forest-light p-4 text-sm text-ink">
          <p className="font-medium">{isCorrect ? "Correct!" : "Not quite."}</p>
          <p className="mt-1 text-ink-muted">{question.explanation}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {!submitted ? (
          <Button onClick={submitAnswer} disabled={!selected}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={nextQuestion}>
            {index + 1 < quiz.questions.length ? "Next Question" : "See Results"}
          </Button>
        )}
      </div>
    </Card>
  );
}