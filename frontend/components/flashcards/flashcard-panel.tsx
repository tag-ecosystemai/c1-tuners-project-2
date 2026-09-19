"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFlashcards } from "@/lib/api";
import { mockFlashcards } from "@/lib/mock-data";
import type { Flashcard } from "@/types";

export function FlashcardPanel({ courseId }: { courseId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const load = () => {
    setLoading(true);
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
    getFlashcards(courseId)
      .then((data) => {
        setCards(data.length ? data : mockFlashcards);
        setUsingMockData(data.length === 0);
      })
      .catch(() => {
        setUsingMockData(true);
        setCards(mockFlashcards);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [courseId]);

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
  };

  if (loading) return <p className="text-sm text-ink-muted">Generating flashcards…</p>;
  if (cards.length === 0) return <p className="text-sm text-ink-muted">No flashcards yet.</p>;

  if (completed) {
    return (
      <Card className="flex max-w-md flex-col items-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-light">
          <Check className="h-5 w-5 text-forest" />
        </div>
        <h2 className="mt-4 font-serif text-xl text-ink">Deck complete.</h2>
        <p className="mt-1 text-sm text-ink-muted">You went through all {cards.length} cards.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={restart}>
            Review again
          </Button>
          <Button onClick={load}>Start another round</Button>
        </div>
      </Card>
    );
  }

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const next = () => {
    setFlipped(false);
    if (isLast) {
      setCompleted(true);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        {usingMockData ? (
          <span className="rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
            Sample flashcards — backend not connected yet
          </span>
        ) : (
          <span />
        )}
        <button onClick={restart} className="text-xs text-ink-muted hover:text-ink">
          Restart
        </button>
      </div>

      <p className="mb-4 text-sm text-ink-muted">
        {index + 1} / {cards.length}
      </p>

      <div
        onClick={() => setFlipped(!flipped)}
        className="h-64 w-full max-w-md cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-cream-card p-8 text-center shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="font-serif text-xl text-ink">{card.front}</p>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-forest p-8 text-center text-white shadow-sm"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-sm">{card.back}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-muted">Tap the card to flip</p>

      <div className="mt-6 flex gap-2">
        {["Again", "Hard", "Good", "Easy"].map((label) => (
          <button
            key={label}
            onClick={next}
            disabled={!flipped}
            className="rounded-full border border-border px-4 py-2 text-sm text-ink hover:bg-forest-light disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}