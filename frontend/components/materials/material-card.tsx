import { FileText, Image as ImageIcon, Music, Presentation } from "lucide-react";
import type { Material } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categorizeFile } from "@/lib/file-type";

const categoryIcons = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  image: ImageIcon,
  audio: Music,
  file: FileText,
};

const categoryLabel = {
  pdf: "PDF",
  docx: "Document",
  pptx: "Slides",
  image: "Image",
  audio: "Audio",
  file: "File",
};

const statusLabel: Record<string, string> = {
  uploading: "Uploading…",
  extracting: "Extracting…",
  understanding: "Understanding…",
  ready: "Ready",
  failed: "Failed",
};

export function MaterialCard({ material }: { material: Material }) {
  // Categorize from the filename first (most reliable), falling back to
  // whatever type string the backend sent.
  const category = categorizeFile(material.name) !== "file"
    ? categorizeFile(material.name)
    : categorizeFile(material.type);

  const Icon = categoryIcons[category];
  const isProcessing = material.status !== "ready" && material.status !== "failed";

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-light">
        <Icon className="h-4 w-4 text-forest" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{material.name}</p>
        <p className="text-xs uppercase text-ink-muted">{categoryLabel[category]}</p>
      </div>
      <Badge tone={material.status === "failed" ? "danger" : isProcessing ? "amber" : "success"}>
        {statusLabel[material.status]}
      </Badge>
    </Card>
  );
}