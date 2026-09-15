"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveLocalProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const HELP_OPTIONS = [
  "Understanding concepts",
  "Exam preparation",
  "Practice questions",
  "Organizing materials",
  "Staying consistent",
];

const STYLE_OPTIONS = [
  "Short explanations",
  "Detailed explanations",
  "Examples",
  "Practice questions",
  "Flashcards",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [level, setLevel] = useState("");
  const [helpWith, setHelpWith] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<string[]>([]);

  const totalSteps = 3;

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const finish = () => {
    saveLocalProfile({
      name: name || "Student",
      university,
      program: `${program}${level ? " · " + level : ""}`,
      courses: [], // courses are created as folders in the Library, not here
      helpWith,
      learningStyle,
    });
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <Card className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2 text-forest">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="mb-8 h-1 w-full rounded-full bg-forest-light">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl text-ink">What should we call you?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              This personalizes your dashboard — no account needed.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-6 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-forest"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-2xl text-ink">What are you studying?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              You&apos;ll add individual courses as folders in your Library next.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  University
                </label>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. University of Lagos"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-forest"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Program / course of study
                </label>
                <input
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Level / year
                </label>
                <input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. 300 level"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-forest"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-serif text-2xl text-ink">
              What do you want help with?
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {HELP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggle(helpWith, setHelpWith, opt)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    helpWith.includes(opt)
                      ? "border-forest bg-forest text-white"
                      : "border-border bg-cream text-ink hover:bg-forest-light"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>

            <h2 className="mt-8 font-serif text-2xl text-ink">
              How do you prefer to learn?
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggle(learningStyle, setLearningStyle, opt)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    learningStyle.includes(opt)
                      ? "border-forest bg-forest text-white"
                      : "border-border bg-cream text-ink hover:bg-forest-light"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={finish}>Go to Dashboard</Button>
          )}
        </div>
      </Card>
    </div>
  );
}