"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Library,
  Sparkles,
  ClipboardList,
  Layers,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/library", label: "Library", icon: Library },
  { href: "/study-agent", label: "Study Agent", icon: Sparkles },
  { href: "/study-plan", label: "Study Plan", icon: Target },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-forest px-4 py-6 text-white">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-serif text-lg">sabilearn</span>
      </div>

      <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-white/50">
        Workspace
      </p>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-amber font-medium text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
