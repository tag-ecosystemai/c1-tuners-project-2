"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { generateQuiz, submitQuizAttempt } from "@/lib/api";
import { mockQuiz } from "@/lib/mock-data";
import type { Quiz, QuizAttemptResult } from "@/types";

export function QuizPanel({ courseId }: { courseId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOptionId: string }[]>([]);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  const load = () => {
    setLoading(true);
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setResult(null);

    generateQuiz(courseId)
      .then(setQuiz)
      .catch(() => {
        setUsingMockData(true);
        setQuiz(mockQuiz);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [courseId]);

  if (loading) return <p className="text-sm text-ink-muted">Generating quiz…</p>;
  if (!quiz) return null;

  const question = quiz.questions[index];
  const isCorrect = selected === question?.correctOptionId;

  const submitAnswer = () => {
    if (!selected) return;
    setSubmitted(true);
    setAnswers((prev) => [...prev, { questionId: question.id, selectedOptionId: selected }]);
  };

  const nextQuestion = async () => {
    if (index + 1 < quiz.questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setSubmitted(false);
      return;
    }

    try {
      const res = await submitQuizAttempt(quiz.quizId, answers);
      setResult(res);
    } catch {
      const correctCount = answers.filter(
        (a) => quiz.questions.find((q) => q.id === a.questionId)?.correctOptionId === a.selectedOptionId
      ).length;
      setResult({
        score: correctCount,
        total: quiz.questions.length,
        strongAreas: correctCount >= quiz.questions.length / 2 ? ["Neural Networks"] : [],
        needsReview: correctCount < quiz.questions.length ? ["Backpropagation"] : [],
      });
    }
  };

  if (result) {
    return (
      <Card>
        {usingMockData && (
          <div className="mb-4 inline-block rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
            Sample quiz — backend not connected yet
          </div>
        )}
        <h2 className="font-serif text-2xl text-ink">Great work.</h2>
        <p className="mt-1 text-3xl font-medium text-forest">
          {result.score}/{result.total}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">Strong areas</p>
            <ul className="mt-2 space-y-1">
              {result.strongAreas.map((a) => (
                <li key={a} className="flex items-center gap-1.5 text-sm text-success">
                  <Check className="h-3.5 w-3.5" /> {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-ink-muted">Needs review</p>
            <ul className="mt-2 space-y-1">
              {result.needsReview.map((a) => (
                <li key={a} className="flex items-center gap-1.5 text-sm text-danger">
                  <X className="h-3.5 w-3.5" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button className="mt-6" onClick={load}>
          Try another quiz
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      {usingMockData && (
        <div className="mb-4 inline-block rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
          Sample quiz — backend not connected yet
        </div>
      )}
      <p className="text-xs text-ink-muted">
        Question {index + 1} of {quiz.questions.length}
      </p>
      <ProgressBar
        className="mt-2"
        value={((index + (submitted ? 1 : 0)) / quiz.questions.length) * 100}
      />

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