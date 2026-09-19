"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Lightbulb, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCourses, askTutor, askStudyAgentChat } from "@/lib/api";
import { mockCourses, mockTutorAnswer } from "@/lib/mock-data";
import type { Course, TutorAnswer } from "@/types";
import ReactMarkdown from "react-markdown";

type AgentMessage =
  | { id: string; role: "student"; text: string }
  | { id: string; role: "ai"; kind: "text"; text: string; source?: string }
  | { id: string; role: "ai"; kind: "tutor"; answer: TutorAnswer; courseLabel: string };

type AiMessage = Extract<AgentMessage, { role: "ai" }>;
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

function matchCourse(text: string, courses: Course[]): Course | undefined {
  const lower = text.toLowerCase();
  return courses.find(
    (c) => lower.includes(c.code.toLowerCase()) || lower.includes(c.name.toLowerCase())
  );
}

export function StudyAgentChat() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data.length ? data : mockCourses))
      .catch(() => setCourses(mockCourses));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, working]);

  const pushAi = (msg: WithoutId<AiMessage>) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() } as AgentMessage]);
  };

  const runTutorFlow = async (course: Course, question: string) => {
    setWorking(true);
    let answer: TutorAnswer;
    try {
      answer = await askTutor(course.id, question);
    } catch {
      answer = mockTutorAnswer;
    }
    setWorking(false);
    pushAi({ role: "ai", kind: "tutor", answer, courseLabel: `${course.code} — ${course.name}` });
  };

  const runGeneralChat = async (question: string) => {
    setWorking(true);
    try {
      // Build history payload
      const historyPayload = messages.map((m) => ({
        role: m.role === "student" ? "student" : "agent",
        content: m.role === "student" ? m.text : (m.kind === "text" ? m.text : m.answer.explanation),
      }));

      const res = await askStudyAgentChat(question, historyPayload);
      setWorking(false);
      pushAi({ role: "ai", kind: "text", text: res.text, source: res.source });
    } catch {
      setWorking(false);
      pushAi({
        role: "ai",
        kind: "text",
        text: "I can help with any of your courses — mention one by name, e.g. \"CSC 301\".",
      });
    }
  };

  const handleSend = (raw: string) => {
    const question = raw.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "student", text: question }]);
    setInput("");

    const match = matchCourse(question, courses);
    match ? runTutorFlow(match, question) : runGeneralChat(question);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {messages.length === 0 && !working && (
          <Card className="max-w-md p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-forest" />
              <p className="text-sm text-ink-muted">
                Ask me anything across your courses — e.g.{" "}
                <span className="text-ink">&quot;explain backpropagation from CSC 301&quot;</span>.
              </p>
            </div>
          </Card>
        )}

        {messages.map((m) => (
          <AgentMessageBubble key={m.id} message={m} />
        ))}

        {working && (
          <Card className="max-w-md p-4">
            <p className="text-sm text-ink-muted">Thinking…</p>
          </Card>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-cream-card px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask anything across your courses…"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink-muted"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || working}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function AgentMessageBubble({ message }: { message: AgentMessage }) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-md rounded-2xl rounded-tr-sm bg-forest px-4 py-2.5 text-sm text-white">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "text") {
    return (
      <Card className="max-w-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
          <div className="flex-1 overflow-hidden">
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
                {message.text}
              </ReactMarkdown>
            </div>

            {message.source && (
              <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-ink-muted">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{message.source}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const { answer, courseLabel } = message;
  return (
    <Card className="max-w-2xl p-5 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest">
        {courseLabel}
      </p>
      <div className="flex items-start gap-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        <div className="flex-1 overflow-hidden space-y-3">
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

          {answer.analogy && (
            <div className="flex items-start gap-2 rounded-lg bg-amber/10 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-dark" />
              <p className="text-sm text-ink-muted">{answer.analogy}</p>
            </div>
          )}

          {answer.source && (
            <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-ink-muted">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{answer.source}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}