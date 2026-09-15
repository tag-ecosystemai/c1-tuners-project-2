import { StudyAgentChat } from "@/components/study-agent/study-agent-chat";

export default function StudyAgentPage() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <h1 className="font-serif text-3xl text-ink">Study Agent</h1>
      <p className="mt-1 mb-6 text-ink-muted">
        Chat across all your courses — ask questions or plan your prep.
      </p>
      <StudyAgentChat />
    </div>
  );
}