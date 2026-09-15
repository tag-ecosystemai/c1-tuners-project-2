"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Lightbulb, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCourses, askTutor, createStudyPlan } from "@/lib/api";
import { mockCourses, mockMaterials, mockTutorAnswer, mockStudyPlan } from "@/lib/mock-data";
import { saveLatestPlan } from "@/lib/study-plan-store";
import type { Course, TutorAnswer, StudyPlan } from "@/types";

type AgentMessage =
  | { id: string; role: "student"; text: string }
  | { id: string; role: "ai"; kind: "text"; text: string }
  | { id: string; role: "ai"; kind: "tutor"; answer: TutorAnswer; courseLabel: string }
  | { id: string; role: "ai"; kind: "plan"; plan: StudyPlan; courseLabel: string; mock: boolean };

type AiMessage = Extract<AgentMessage, { role: "ai" }>;
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

const PLAN_INTENT = /exam|prepare|preparing|study plan|plan for|get ready|revise|revision/i;

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
  const [working, setWorking] = useState<{ steps: string[]; stepIndex: number } | null>(null);
  const [pendingCourse, setPendingCourse] = useState<{ question: string; isPlan: boolean } | null>(
    null
  );
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data.length ? data : mockCourses))
      .catch(() => setCourses(mockCourses));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, working, pendingCourse]);

  const pushAi = (msg: WithoutId<AiMessage>) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() } as AgentMessage]);
  };

  const runTutorFlow = async (course: Course, question: string) => {
    setWorking({ steps: ["Thinking…"], stepIndex: 0 });
    let answer: TutorAnswer;
    try {
      answer = await askTutor(course.id, question);
    } catch {
      answer = mockTutorAnswer;
    }
    setWorking(null);
    pushAi({ role: "ai", kind: "tutor", answer, courseLabel: `${course.code} — ${course.name}` });
  };

  const runPlanFlow = async (course: Course, question: string) => {
    const materialCount = mockMaterials[course.id]?.length ?? 3;
    const steps = [
      "Understanding your request…",
      `Found ${course.code} — ${course.name}`,
      `Reviewed ${materialCount} course materials`,
      "Checked your recent quiz performance",
      "Identified weak areas",
      "Created your study plan",
    ];
    for (let i = 0; i < steps.length; i++) {
      setWorking({ steps, stepIndex: i });
      await new Promise((r) => setTimeout(r, 600));
    }

    let plan: StudyPlan;
    let mock = false;
    try {
      plan = await createStudyPlan(question, `${course.code} — ${course.name}`);
    } catch {
      plan = mockStudyPlan;
      mock = true;
    }
    setWorking(null);
    saveLatestPlan(plan, `${course.code} — ${course.name}`);
    pushAi({ role: "ai", kind: "plan", plan, courseLabel: `${course.code} — ${course.name}`, mock });
  };

  const handleSend = (raw: string) => {
    const question = raw.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "student", text: question }]);
    setInput("");

    const isPlan = PLAN_INTENT.test(question);
    const match = matchCourse(question, courses);

    if (match) {
      isPlan ? runPlanFlow(match, question) : runTutorFlow(match, question);
    } else if (isPlan) {
      pushAi({ role: "ai", kind: "text", text: "Which course is this for?" });
      setPendingCourse({ question, isPlan: true });
    } else {
      pushAi({
        role: "ai",
        kind: "text",
        text: "I can help with any of your courses — mention one by name (e.g. \"CSC 301\"), or ask me to help you prepare for an exam.",
      });
    }
  };

  const pickCourseForPending = (course: Course) => {
    if (!pendingCourse) return;
    const { question, isPlan } = pendingCourse;
    setPendingCourse(null);
    isPlan ? runPlanFlow(course, question) : runTutorFlow(course, question);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && !working && (
          <Card className="max-w-md">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-forest" />
              <p className="text-sm text-ink-muted">
                Ask me anything across your courses, or tell me what&apos;s coming up —
                e.g. <span className="text-ink">&quot;I have a CSC 301 exam in 3 days&quot;</span>{" "}
                or <span className="text-ink">&quot;explain backpropagation from MTH 201&quot;</span>.
              </p>
            </div>
          </Card>
        )}

        {messages.map((m) => (
          <AgentMessageBubble key={m.id} message={m} tasksDone={tasksDone} setTasksDone={setTasksDone} />
        ))}

        {working && (
          <Card className="max-w-md">
            <div className="space-y-2">
              {working.steps.map((step, i) => (
                <p
                  key={step}
                  className={
                    i === working.stepIndex ? "text-sm text-ink" : "text-sm text-ink-muted"
                  }
                >
                  {i <= working.stepIndex ? "✓ " : ""}
                  {step}
                </p>
              ))}
            </div>
          </Card>
        )}

        {pendingCourse && (
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCourseForPending(c)}
                className="rounded-full border border-border bg-cream-card px-3 py-1.5 text-sm text-ink hover:bg-forest-light"
              >
                {c.code}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-cream-card px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask anything, or tell me what's coming up…"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink-muted"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || !!working}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function AgentMessageBubble({
  message,
  tasksDone,
  setTasksDone,
}: {
  message: AgentMessage;
  tasksDone: Record<string, boolean>;
  setTasksDone: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
}) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-md rounded-2xl rounded-tr-sm bg-forest px-4 py-3 text-sm text-white">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "text") {
    return (
      <Card className="max-w-md">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
          <p className="text-sm text-ink">{message.text}</p>
        </div>
      </Card>
    );
  }

  if (message.kind === "tutor") {
    const { answer, courseLabel } = message;
    return (
      <Card className="max-w-xl">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
          {courseLabel}
        </p>
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
          <div className="flex-1 space-y-3">
            <p className="text-sm text-ink">{answer.explanation}</p>
            {answer.analogy && (
              <div className="flex items-start gap-2 rounded-lg bg-amber/10 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-dark" />
                <p className="text-sm text-ink-muted">{answer.analogy}</p>
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

  // kind === "plan"
  const { plan, courseLabel, mock } = message;
  return (
    <div className="max-w-xl space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Study plan · {courseLabel}
        {mock && (
          <span className="ml-2 rounded-full bg-amber/15 px-2 py-0.5 text-amber-dark">
            Sample — backend offline
          </span>
        )}
      </p>
      {plan.days.map((day) => (
        <Card key={day.day}>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Day {day.day}
          </p>
          <h3 className="mt-1 font-serif text-lg text-ink">{day.topic}</h3>
          <div className="mt-3 space-y-2">
            {day.tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tasksDone[task.id] ?? task.done}
                  onChange={(e) =>
                    setTasksDone((prev) => ({ ...prev, [task.id]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border accent-forest"
                />
                <span className={tasksDone[task.id] ? "text-ink-muted line-through" : "text-ink"}>
                  {task.label}
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}