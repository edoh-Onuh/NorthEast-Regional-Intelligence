import type { MetricMeta } from "@/lib/catalog";
import type { SeriesPoint } from "@/lib/db/queries";
import { laShortName } from "@/lib/geographies";
import { formatValue } from "@/lib/format";
import { latestPerLA, summarizeMetric } from "@/lib/seriesUtils";
import { StatCard } from "./StatCard";
import { PeriodBadge } from "./PeriodBadge";
import { TimeSeriesChart } from "./charts/TimeSeriesChart";
import { ComparisonBarChart } from "./charts/ComparisonBarChart";
import { AccessibleDataTable } from "./AccessibleDataTable";

interface Props {
  metric: MetricMeta;
  points: SeriesPoint[];
}

export function MetricCard({ metric, points }: Props) {
  const summary = summarizeMetric(points);
  const isSnapshot = metric.chart === "bar";

  return (
    <section
      aria-labelledby={`metric-${metric.key}`}
      className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 id={`metric-${metric.key}`} className="text-sm font-semibold text-foreground">
            {metric.label}
          </h3>
          <p className="mt-0.5 text-xs text-foreground-muted">{metric.description}</p>
        </div>
        {summary.latestPeriod && <PeriodBadge period={summary.latestPeriod} />}
      </div>

      {summary.min && summary.max && (
        <div className="mb-4 flex flex-wrap gap-2.5">
          <StatCard
            label="Highest"
            value={formatValue(summary.max.value, metric.format)}
            sub={laShortName(summary.max.laCode)}
          />
          <StatCard
            label="Lowest"
            value={formatValue(summary.min.value, metric.format)}
            sub={laShortName(summary.min.laCode)}
          />
        </div>
      )}

      {isSnapshot ? (
        <ComparisonBarChart latest={latestPerLA(points)} metric={metric} />
      ) : (
        <TimeSeriesChart points={points} metric={metric} />
      )}
      <AccessibleDataTable points={points} metric={metric} />
    </section>
  );
}
