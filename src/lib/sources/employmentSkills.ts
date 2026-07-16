import { NORTH_EAST_LAS } from "@/lib/geographies";
import { fetchNomisData } from "./nomisClient";
import { recentDecembers, recentQuarterLabels } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const DATASET_ID = "NM_17_5";
const SOURCE_URL = "https://www.nomisweb.co.uk/datasets/apsnew";

// NOMIS NM_17_5 ("annual population survey (variables (percentages))")
// uses a single VARIABLE dimension rather than separate age/sex splits.
// Codes resolved against the live /variable.def.sdmx.json codelist.
//
// The two families of variables are published on DIFFERENT period cadences:
//  - Employment rate updates as rolling 12-month periods labelled by end
//    quarter (e.g. "2025-03" = Apr 2024–Mar 2025), so it wants quarter labels.
//  - Qualifications (NVQ4+, no quals) are an annual Jan–Dec series labelled by
//    December ("2021-12"); they return nothing for arbitrary quarter labels
//    (obs_status "Q"/"F", empty value), so they must be queried at December
//    period labels. Querying quarters for these — as this fetcher used to —
//    yields zero rows and an empty Skills page.
const VARIABLES: { code: number; metric: string; domain: "labour" | "skills"; cadence: "quarter" | "annual" }[] = [
  { code: 45, metric: "employment_rate", domain: "labour", cadence: "quarter" },
  { code: 290, metric: "nvq4_pct", domain: "skills", cadence: "annual" },
  { code: 344, metric: "no_quals_pct", domain: "skills", cadence: "annual" },
];

/**
 * Employment rate and skills/qualifications levels, working-age (16-64),
 * by local authority. Employment is queried at rolling quarter-end labels;
 * qualifications at annual December labels (see the note on VARIABLES above).
 * Small local authorities are sometimes suppressed (obs_status "F") for the
 * qualifications breakdowns due to APS sample-size disclosure rules; those
 * rows are omitted, not estimated — an expected data gap, not a fetch failure.
 */
export const employmentSkillsFetcher: DataSourceFetcher = {
  key: "nomis-aps-employment-skills",
  domain: "labour",
  label: "Employment Rate & Qualifications (NOMIS NM_17_5)",

  async fetch(): Promise<SourceFetchResult> {
    const geography = NORTH_EAST_LAS.map((la) => la.nomisId).join(",");
    const quarterDates = recentQuarterLabels(8).join(",");
    // Request a generous run of Decembers: recent years are still suspended
    // (ONS APS reweighting), so those come back empty and are filtered out,
    // while the published years yield a real multi-year series.
    const annualDates = recentDecembers(12).join(",");
    const laByGeogCode = new Map(NORTH_EAST_LAS.map((la) => [la.code, la]));

    const observations: RawObservation[] = [];

    for (const variable of VARIABLES) {
      const obs = await fetchNomisData(DATASET_ID, {
        geography,
        date: variable.cadence === "quarter" ? quarterDates : annualDates,
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
