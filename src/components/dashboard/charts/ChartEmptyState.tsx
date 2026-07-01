import { DatabaseZap } from "lucide-react";

export function ChartEmptyState({ message }: { message?: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border text-center text-foreground-subtle">
      <DatabaseZap className="h-6 w-6" aria-hidden="true" />
      <p className="max-w-xs text-xs">
        {message ?? "No data yet — this metric populates after the next scheduled ingestion run."}
      </p>
    </div>
  );
}
