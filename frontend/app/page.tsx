import Link from "next/link";
import {
  Sparkles,
  FileStack,
  Clock,
  Brain,
  Compass,
  Upload,
  MessageCircle,
  ClipboardCheck,
  Layers,
  Target,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="bg-cream">
      {/* Nav */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-cream/90 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest">
            <Sparkles className="h-4 w-4 text-amber" />
          </div>
          <span className="font-serif text-lg text-ink">sabilearn</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          <a href="#how-it-works" className="hover:text-ink">How it works</a>
          <a href="#features" className="hover:text-ink">Features</a>
        </nav>
        <Link href="/onboarding">
          <Button size="sm">Get Started</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-8 py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-serif text-5xl leading-[1.1] text-ink lg:text-6xl">
            Turn your course materials into a smarter way to learn.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">
            Upload your notes and slides. Ask questions, generate quizzes and
            flashcards, and get a study plan built around what you actually
            need to review.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/onboarding">
              <Button size="lg">Start Learning</Button>
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-forest hover:underline">
              See how it works
            </a>
          </div>
        </div>

        {/* Mocked product preview — no stock imagery, the product IS the visual */}
        <div className="relative">
          <div className="absolute -right-4 -top-4 h-full w-full rounded-3xl bg-forest-light" />
          <div className="relative rounded-3xl border border-border bg-cream-card p-5 shadow-lg">
            <div className="flex items-center justify-between rounded-xl bg-forest px-4 py-3 text-white">
              <span className="text-xs text-white/70">Continue learning</span>
              <span className="text-xs font-medium text-amber">68%</span>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                CSC 301 · Artificial Intelligence
              </p>
              <p className="font-serif text-xl text-ink">
                Lecture 05 — Neural Networks
              </p>
            </div>
            <div className="mt-5 rounded-xl border border-border bg-cream p-4">
              <p className="text-xs font-medium text-forest">AI Tutor</p>
              <p className="mt-1 text-sm text-ink-muted">
                &quot;Can you explain backpropagation in simple terms?&quot;
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-forest-light px-3 py-1 text-xs text-forest">
                Quiz me
              </span>
              <span className="rounded-full bg-forest-light px-3 py-1 text-xs text-forest">
                Give an example
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-cream-card px-8 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-serif text-3xl text-ink">
              Studying is scattered across too many places.
            </h2>
          </div>
          <ul className="space-y-5 border-l border-border pl-8">
            {[
              { icon: FileStack, text: "Dozens of PDFs, slides, and scanned notes with no single place to search them." },
              { icon: Clock, text: "Lecture recordings you never have time to sit through again." },
              { icon: Brain, text: "Concepts you half-understand until the night before the exam." },
              { icon: Compass, text: "No clear sense of what to actually study next." },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <p className="text-ink-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl text-ink">How it works</h2>
          <div className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-border md:block" />
            {[
              { n: "1", icon: Upload, title: "Bring your materials", text: "Upload notes, slides, and textbooks." },
              { n: "2", icon: Brain, title: "AI understands them", text: "Your materials become searchable knowledge." },
              { n: "3", icon: MessageCircle, title: "Learn and practice", text: "Ask questions, take quizzes, review flashcards." },
              { n: "4", icon: Target, title: "Know what's next", text: "See exactly what to study before an exam." },
            ].map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="relative">
                <div className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-medium text-white">
                  {n}
                </div>
                <Icon className="mt-4 h-5 w-5 text-amber" />
                <h3 className="mt-3 font-medium text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-cream-card px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl text-ink">Everything you need to actually learn</h2>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileStack, title: "Personal Learning Library", text: "Every material organized by course, searchable in one place." },
              { icon: MessageCircle, title: "AI Tutor", text: "Ask questions and get grounded, source-linked answers." },
              { icon: ClipboardCheck, title: "Adaptive Quizzes", text: "Questions generated straight from your own materials." },
              { icon: Layers, title: "Flashcards", text: "Auto-generated cards for quick, focused revision." },
              { icon: Target, title: "Study Plans", text: "A day-by-day plan built around what's coming up." },
              { icon: Sparkles, title: "Study Agent", text: "Tell it what's coming, and it plans your prep for you." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="h-5 w-5 text-forest" />
                <h3 className="mt-3 font-medium text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — dark band, breaks the cream monotony */}
      <section className="bg-forest px-8 py-24 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl leading-tight lg:text-4xl">
            Your materials already contain what you need to learn.
          </h2>
          <p className="mt-3 text-white/70">Let&apos;s make them work harder for you.</p>
          <Link href="/onboarding" className="mt-8 inline-block">
            <Button size="lg">
              Start Learning <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-sm text-ink-muted">
        sabilearn — built for students, not accounts.
      </footer>
    </div>
  );
}