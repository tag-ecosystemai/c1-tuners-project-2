export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={`h-1.5 w-full rounded-full bg-forest-light ${className ?? ""}`}>
      <div
        className="h-full rounded-full bg-amber transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
