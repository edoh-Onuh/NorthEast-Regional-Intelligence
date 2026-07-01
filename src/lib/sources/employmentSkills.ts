import { NORTH_EAST_LAS } from "@/lib/geographies";
import { fetchNomisData } from "./nomisClient";
import { recentQuarterLabels } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const DATASET_ID = "NM_17_5";
const SOURCE_URL = "https://www.nomisweb.co.uk/datasets/apsnew";

// NOMIS NM_17_5 ("annual population survey (variables (percentages))")
// uses a single VARIABLE dimension rather than separate age/sex splits.
// Codes resolved against the live /variable.def.sdmx.json codelist.
const VARIABLES: { code: number; metric: string; domain: "labour" | "skills" }[] = [
  { code: 45, metric: "employment_rate", domain: "labour" },
  { code: 290, metric: "nvq4_pct", domain: "skills" },
  { code: 344, metric: "no_quals_pct", domain: "skills" },
];

/**
 * Employment rate and skills/qualifications levels, working-age (16-64),
 * by local authority. Published as rolling 12-month periods labelled by end
 * quarter (e.g. "2024-12" = Jan-Dec 2024) — arbitrary months return nothing.
 * Small local authorities are frequently suppressed (obs_status "F") for the
 * qualifications breakdowns due to APS sample-size disclosure rules; that's
 * an expected data gap, not a fetch failure, and is simply omitted.
 */
export const employmentSkillsFetcher: DataSourceFetcher = {
  key: "nomis-aps-employment-skills",
  domain: "labour",
  label: "Employment Rate & Qualifications (NOMIS NM_17_5)",

  async fetch(): Promise<SourceFetchResult> {
    const geography = NORTH_EAST_LAS.map((la) => la.nomisId).join(",");
    const date = recentQuarterLabels(8).join(",");
    const laByGeogCode = new Map(NORTH_EAST_LAS.map((la) => [la.code, la]));

    const observations: RawObservation[] = [];

    for (const variable of VARIABLES) {
      const obs = await fetchNomisData(DATASET_ID, {
        geography,
        date,
        variable: String(variable.code),
        measures: "20599",
      });

      for (const o of obs) {
        if (!laByGeogCode.has(o.geogcode)) continue;
        observations.push({
          laCode: o.geogcode,
          domain: variable.domain,
          metric: variable.metric,
          period: o.time,
          periodType: "annual",
          value: o.value,
          unit: "percent",
        });
      }
    }

    return {
      source: DATASET_ID,
      sourceUrl: SOURCE_URL,
      domain: "labour",
      observations,
    };
  },
};
