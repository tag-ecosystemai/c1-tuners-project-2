"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { TutorMessage } from "@/components/tutor/tutor-message";
import { askTutor } from "@/lib/api";
import { mockTutorAnswer } from "@/lib/mock-data";
import type { ChatMessage } from "@/types";

const QUICK_ACTIONS = ["Explain simpler", "Give me an example", "Quiz me", "Go deeper"];

export function TutorPanel({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const send = async (question: string) => {
    if (!question.trim() || sending) return;

    const historyPayload = messages.map((m) => ({
      role: m.role === "student" ? "user" : "assistant",
      content: (m.role === "student" ? m.question : m.answer?.explanation) ?? "",
    }));

    const studentMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "student",
      question,
    };
    setMessages((prev) => [...prev, studentMessage]);
    setInput("");
    setSending(true);

    try {
      const answer = await askTutor(courseId, question, historyPayload);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", answer },
      ]);
    } catch {
      setUsingMockData(true);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", answer: mockTutorAnswer },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        {usingMockData ? (
          <span className="inline-block rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
            Showing sample answers — backend not connected yet
          </span>
        ) : (
          <span />
        )}
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto text-xs text-ink-muted hover:text-ink"
          >
            Restart
          </button>
        )}
      </div>

      <div className="min-h-[200px] space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-muted">
            Ask anything about this course&apos;s materials.
          </p>
        )}
        {messages.map((m) => (
          <TutorMessage key={m.id} message={m} />
        ))}
        {sending && <p className="text-sm text-ink-muted">Thinking…</p>}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => send(action)}
              disabled={sending}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-muted hover:bg-forest-light hover:text-forest disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-cream-card px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask anything about this course…"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink-muted"
        />
        <button
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}