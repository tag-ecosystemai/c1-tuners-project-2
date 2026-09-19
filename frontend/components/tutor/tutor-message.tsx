import { BookOpen, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

export function TutorMessage({ message }: { message: ChatMessage }) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-md rounded-2xl rounded-tr-sm bg-forest px-4 py-2.5 text-sm text-white">
          {message.question}
        </div>
      </div>
    );
  }

  const answer = message.answer;
  if (!answer) return null;

  return (
    <Card className="max-w-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-light">
          <Sparkles className="h-4 w-4 text-forest" />
        </div>
        <div className="flex-1 overflow-hidden">
          {/* Formatted markdown explanation */}
          <div className="prose prose-sm max-w-none text-ink space-y-2.5 leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
              }}
            >
              {answer.explanation}
            </ReactMarkdown>
          </div>

          {answer.source && (
            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-ink-muted">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{answer.source}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}