import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: { direction: "up" | "down"; label: string } | null;
  className?: string;
}

export function StatCard({ label, value, sub, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-[150px] flex-1 flex-col gap-1.5 rounded-xl border border-surface-border bg-surface px-4 py-3.5 shadow-sm",
        className
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight text-foreground">{value}</div>
      {sub && <div className="text-xs text-foreground-muted">{sub}</div>}
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-positive" : "text-negative"
          )}
        >
          {trend.direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {trend.label}
        </div>
      )}
    </div>
  );
}
