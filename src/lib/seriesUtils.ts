import type { SeriesPoint } from "@/lib/db/queries";

/** Most recent observation per local authority, from an in-memory points array. */
export function latestPerLA(points: SeriesPoint[]): SeriesPoint[] {
  const sorted = [...points].sort((a, b) => a.period.localeCompare(b.period));
  const map = new Map<string, SeriesPoint>();
  for (const p of sorted) map.set(p.laCode, p);
  return Array.from(map.values());
}

export interface MetricSummary {
  latestPeriod: string | null;
  min: { laCode: string; value: number } | null;
  max: { laCode: string; value: number } | null;
}

export function summarizeMetric(points: SeriesPoint[]): MetricSummary {
  const latest = latestPerLA(points);
  if (latest.length === 0) return { latestPeriod: null, min: null, max: null };

  const latestPeriod = latest.reduce((max, p) => (p.period > max ? p.period : max), latest[0].period);
  const min = latest.reduce((m, p) => (p.value < m.value ? p : m), latest[0]);
  const max = latest.reduce((m, p) => (p.value > m.value ? p : m), latest[0]);

  return {
    latestPeriod,
    min: { laCode: min.laCode, value: min.value },
    max: { laCode: max.laCode, value: max.value },
  };
}
