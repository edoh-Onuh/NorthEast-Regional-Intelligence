import { claimantCountFetcher } from "@/lib/sources/claimantCount";
import { employmentSkillsFetcher } from "@/lib/sources/employmentSkills";
import { populationFetcher } from "@/lib/sources/population";
import { businessCountsFetcher } from "@/lib/sources/businessCounts";
import { housingFetcher } from "@/lib/sources/housing";
import { healthFetcher } from "@/lib/sources/health";
import { gvaSnapshotFetcher } from "@/lib/sources/gvaSnapshot";
import type { DataSourceFetcher } from "@/lib/sources/types";

/**
 * Central registry of every real-data fetcher the ingestion pipeline runs.
 * Crime is intentionally absent — see the "crime" domain's cadenceNote in
 * lib/catalog.ts for why no trustworthy live LA-level source exists.
 */
export const ALL_FETCHERS: DataSourceFetcher[] = [
  claimantCountFetcher,
  employmentSkillsFetcher,
  populationFetcher,
  businessCountsFetcher,
  housingFetcher,
  healthFetcher,
  gvaSnapshotFetcher,
];
