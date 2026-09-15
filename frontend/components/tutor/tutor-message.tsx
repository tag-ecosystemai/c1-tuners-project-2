import { Lightbulb, BookOpen, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { Card } from "@/components/ui/card";

export function TutorMessage({ message }: { message: ChatMessage }) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-md rounded-2xl rounded-tr-sm bg-forest px-4 py-3 text-sm text-white">
          {message.question}
        </div>
      </div>
    );
  }

  const answer = message.answer;
  if (!answer) return null;

  return (
    <Card className="max-w-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-light">
          <Sparkles className="h-3.5 w-3.5 text-forest" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-ink">{answer.explanation}</p>

          {answer.analogy && (
            <div className="flex items-start gap-2 rounded-lg bg-amber/10 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-dark" />
              <p className="text-sm text-ink-muted">{answer.analogy}</p>
            </div>
          )}

          {answer.example && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Example
              </p>
              <p className="mt-1 text-sm text-ink-muted">{answer.example}</p>
            </div>
          )}

          {answer.source && (
            <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-ink-muted">
              <BookOpen className="h-3 w-3" />
              {answer.source}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}