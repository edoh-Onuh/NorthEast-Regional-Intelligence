import { CalendarDays } from "lucide-react";
import { formatPeriod } from "@/lib/format";

/**
 * "As of <period>" vintage badge shown on every metric card. Uniform wording
 * across domains makes the difference in data currency scannable and directly
 * comparable — e.g. Skills "As of Dec 2021" (latest ONS APS qualifications
 * release, pre-reweighting pause) next to Housing "As of Mar 2025".
 */
export function PeriodBadge({ period }: { period: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-foreground-subtle"
      title={`Data as of ${formatPeriod(period)}`}
    >
      <CalendarDays className="h-3 w-3" aria-hidden="true" />
      As of {formatPeriod(period)}
    </span>
  );
}
