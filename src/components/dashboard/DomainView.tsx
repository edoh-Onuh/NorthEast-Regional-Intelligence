import { AlertTriangle, CircleSlash } from "lucide-react";
import type { DomainMeta, MetricMeta } from "@/lib/catalog";
import type { ObservationRow } from "@/lib/db/queries";
import { MetricCard } from "./MetricCard";
import { StatCard } from "./StatCard";
import { laShortName } from "@/lib/geographies";
import { formatValue } from "@/lib/format";

interface Props {
  domain: DomainMeta;
  metrics: MetricMeta[];
  observations: ObservationRow[];
}

/** GVA per capita, derived at render time from two independently-sourced real metrics (no separate storage needed). */
function GvaPerCapitaCard({ observations }: { observations: ObservationRow[] }) {
  const gva = observations.filter((o) => o.domain === "economy" && o.metric === "gva_total");
  const population = observations.filter((o) => o.domain === "population" && o.metric === "population_total");
  if (gva.length === 0 || population.length === 0) return null;

  const populationPeriods = new Set(population.map((p) => p.period));
  const sharedPeriods = [...new Set(gva.map((g) => g.period))].filter((p) => populationPeriods.has(p));
  if (sharedPeriods.length === 0) return null;
  const latestPeriod = sharedPeriods.sort().at(-1)!;

  const perCapita = gva
    .filter((g) => g.period === latestPeriod)
    .map((g) => {
      const pop = population.find((p) => p.period === latestPeriod && p.laCode === g.laCode);
      if (!pop || pop.value === 0) return null;
      return { laCode: g.laCode, value: (g.value * 1_000_000) / pop.value };
    })
    .filter((v): v is { laCode: string; value: number } => v !== null)
    .sort((a, b) => b.value - a.value);

  if (perCapita.length === 0) return null;

  return (
    <section className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">GVA per Capita ({latestPeriod})</h3>
      <p className="mt-0.5 mb-3 text-xs text-foreground-muted">
        Derived from GVA (economy) and mid-year population estimates (population) — real figures from two
        independent ONS/NOMIS sources, combined at render time rather than stored.
      </p>
      <div className="flex flex-wrap gap-2.5">
        {perCapita.map((p) => (
          <StatCard key={p.laCode} label={laShortName(p.laCode)} value={formatValue(p.value, "currency-gbp")} />
        ))}
      </div>
    </section>
  );
}

export function DomainView({ domain, metrics, observations }: Props) {
  if (domain.cadence === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface px-6 py-14 text-center">
        <CircleSlash className="h-8 w-8 text-foreground-subtle" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground">{domain.label} data isn&apos;t available yet</h2>
        <p className="max-w-lg text-sm text-foreground-muted">{domain.cadenceNote}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {domain.cadenceNote && (
        <div className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface px-4 py-3 text-xs text-foreground-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" aria-hidden="true" />
          <p>{domain.cadenceNote}</p>
        </div>
      )}
      {domain.key === "economy" && <GvaPerCapitaCard observations={observations} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            points={observations.filter((o) => o.domain === metric.domain && o.metric === metric.key)}
          />
        ))}
      </div>
    </div>
  );
}
