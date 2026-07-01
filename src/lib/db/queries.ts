import { and, desc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { indicatorObservations, ingestionRuns, localAuthorities } from "@/lib/db/schema";
import type { IndicatorDomain } from "@/lib/db/schema";

export interface SeriesPoint {
  laCode: string;
  period: string;
  value: number;
  unit: string | null;
}

export interface ObservationRow extends SeriesPoint {
  domain: IndicatorDomain;
  metric: string;
  sourceDataset: string;
  sourceUrl: string | null;
}

/**
 * Fetches the entire observation table in one round trip (dataset is small:
 * 7 LAs x ~16 metrics x a few dozen periods) so the dashboard page can group
 * by domain/metric in memory instead of issuing one query per chart.
 */
export async function getAllObservations(): Promise<ObservationRow[]> {
  const rows = await db
    .select({
      laCode: indicatorObservations.laCode,
      domain: indicatorObservations.domain,
      metric: indicatorObservations.metric,
      period: indicatorObservations.period,
      value: indicatorObservations.value,
      unit: indicatorObservations.unit,
      sourceDataset: indicatorObservations.sourceDataset,
      sourceUrl: indicatorObservations.sourceUrl,
    })
    .from(indicatorObservations)
    .orderBy(indicatorObservations.period);

  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

/** Full time series for one metric, every local authority, oldest period first. */
export async function getSeries(domain: IndicatorDomain, metric: string): Promise<SeriesPoint[]> {
  const rows = await db
    .select({
      laCode: indicatorObservations.laCode,
      period: indicatorObservations.period,
      value: indicatorObservations.value,
      unit: indicatorObservations.unit,
    })
    .from(indicatorObservations)
    .where(and(eq(indicatorObservations.domain, domain), eq(indicatorObservations.metric, metric)))
    .orderBy(indicatorObservations.period);

  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

/** Most recent value per local authority for a metric. */
export async function getLatestByLA(domain: IndicatorDomain, metric: string): Promise<SeriesPoint[]> {
  const series = await getSeries(domain, metric);
  const latest = new Map<string, SeriesPoint>();
  for (const point of series) {
    latest.set(point.laCode, point); // series is period-ascending, so the last write wins
  }
  return Array.from(latest.values());
}

export interface Checkpoint {
  domain: string;
  source: string;
  status: string;
  rowsWritten: number;
  finishedAt: Date | null;
  errorMessage: string | null;
}

/** Latest ingestion run per (domain, source) — powers the Data Provenance panel. */
export async function getCheckpoints(): Promise<Checkpoint[]> {
  const latestPerSource = db
    .select({
      source: ingestionRuns.source,
      finishedAt: max(ingestionRuns.finishedAt).as("finished_at"),
    })
    .from(ingestionRuns)
    .groupBy(ingestionRuns.source)
    .as("latest_per_source");

  const rows = await db
    .select({
      domain: ingestionRuns.domain,
      source: ingestionRuns.source,
      status: ingestionRuns.status,
      rowsWritten: ingestionRuns.rowsWritten,
      finishedAt: ingestionRuns.finishedAt,
      errorMessage: ingestionRuns.errorMessage,
    })
    .from(ingestionRuns)
    .innerJoin(
      latestPerSource,
      and(
        eq(ingestionRuns.source, latestPerSource.source),
        eq(ingestionRuns.finishedAt, latestPerSource.finishedAt)
      )
    )
    .orderBy(desc(ingestionRuns.finishedAt));

  return rows;
}

export async function getLocalAuthorities() {
  return db.select().from(localAuthorities);
}
