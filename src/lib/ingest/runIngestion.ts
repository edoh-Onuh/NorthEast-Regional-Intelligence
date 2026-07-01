import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { indicatorObservations, ingestionRuns, localAuthorities } from "@/lib/db/schema";
import { NORTH_EAST_LAS } from "@/lib/geographies";
import type { DataSourceFetcher } from "@/lib/sources/types";

export interface IngestionOutcome {
  key: string;
  domain: string;
  status: "success" | "partial" | "failed";
  rowsWritten: number;
  errorMessage?: string;
}

/** Idempotent upsert of the fixed 7-local-authority reference table. */
async function ensureLocalAuthorities() {
  await db
    .insert(localAuthorities)
    .values(
      NORTH_EAST_LAS.map((la) => ({
        code: la.code,
        name: la.name,
        shortName: la.shortName,
        nomisId: la.nomisId,
        policeForce: la.policeForce,
        colorVar: la.colorVar,
      }))
    )
    .onConflictDoUpdate({
      target: localAuthorities.code,
      set: {
        name: sql`excluded.name`,
        shortName: sql`excluded.short_name`,
        nomisId: sql`excluded.nomis_id`,
        policeForce: sql`excluded.police_force`,
        colorVar: sql`excluded.color_var`,
      },
    });
}

const CHUNK_SIZE = 500;

/**
 * Runs every registered fetcher, upserts its observations, and writes an
 * ingestion_runs "checkpoint" row per fetcher (success/partial/failed) so
 * data freshness and provenance are auditable from the app and from ops.
 */
export async function runIngestion(
  fetchers: DataSourceFetcher[]
): Promise<IngestionOutcome[]> {
  await ensureLocalAuthorities();

  const outcomes: IngestionOutcome[] = [];

  for (const fetcher of fetchers) {
    const startedAt = new Date();
    try {
      const result = await fetcher.fetch();
      const rows = result.observations.map((o) => ({
        laCode: o.laCode,
        domain: o.domain,
        metric: o.metric,
        period: o.period,
        periodType: o.periodType,
        value: o.value.toString(),
        unit: o.unit,
        sourceDataset: result.source,
        sourceUrl: result.sourceUrl,
      }));

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;
        await db
          .insert(indicatorObservations)
          .values(chunk)
          .onConflictDoUpdate({
            target: [
              indicatorObservations.laCode,
              indicatorObservations.domain,
              indicatorObservations.metric,
              indicatorObservations.period,
            ],
            set: {
              value: sql`excluded.value`,
              unit: sql`excluded.unit`,
              sourceDataset: sql`excluded.source_dataset`,
              sourceUrl: sql`excluded.source_url`,
              retrievedAt: sql`now()`,
            },
          });
      }

      const status: IngestionOutcome["status"] = rows.length === 0 ? "partial" : "success";
      // A fetcher can populate more than one domain (e.g. the APS source
      // covers both "labour" and "skills" metrics); log one checkpoint per
      // domain actually written so the provenance panel reflects reality.
      const domainsWritten = new Set(result.observations.map((o) => o.domain));
      if (domainsWritten.size === 0) domainsWritten.add(fetcher.domain);
      const rowsByDomain = new Map<string, number>();
      for (const o of result.observations) {
        rowsByDomain.set(o.domain, (rowsByDomain.get(o.domain) ?? 0) + 1);
      }
      for (const domain of domainsWritten) {
        await db.insert(ingestionRuns).values({
          domain: domain as (typeof fetcher)["domain"],
          source: fetcher.key,
          startedAt,
          finishedAt: new Date(),
          status,
          rowsWritten: rowsByDomain.get(domain) ?? 0,
          errorMessage: rows.length === 0 ? "Fetcher returned zero observations" : null,
        });
      }
      outcomes.push({ key: fetcher.key, domain: fetcher.domain, status, rowsWritten: rows.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await db.insert(ingestionRuns).values({
        domain: fetcher.domain,
        source: fetcher.key,
        startedAt,
        finishedAt: new Date(),
        status: "failed",
        rowsWritten: 0,
        errorMessage,
      });
      outcomes.push({ key: fetcher.key, domain: fetcher.domain, status: "failed", rowsWritten: 0, errorMessage });
    }
  }

  return outcomes;
}
