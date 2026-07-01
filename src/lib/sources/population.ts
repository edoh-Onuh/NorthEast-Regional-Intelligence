import { NORTH_EAST_LAS } from "@/lib/geographies";
import { fetchNomisData } from "./nomisClient";
import { recentYears } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const DATASET_ID = "NM_31_1";
const SOURCE_URL = "https://www.nomisweb.co.uk/datasets/pestsyoala";

// Sex total = 7; Age "All ages" = 0, "Aged 16-64" = 22 (resolved against the
// live /age.def.sdmx.json codelist for this dataset).
const AGE_ALL = 0;
const AGE_WORKING = 22;

/**
 * Mid-year population estimates (total and working-age 16-64), by local
 * authority, annual. NOMIS dataset NM_31_1.
 */
export const populationFetcher: DataSourceFetcher = {
  key: "nomis-population-estimates",
  domain: "population",
  label: "Population Estimates (NOMIS NM_31_1)",

  async fetch(): Promise<SourceFetchResult> {
    const geography = NORTH_EAST_LAS.map((la) => la.nomisId).join(",");
    const date = recentYears(6).join(",");
    const laByGeogCode = new Map(NORTH_EAST_LAS.map((la) => [la.code, la]));

    const observations: RawObservation[] = [];

    for (const [age, metric] of [
      [AGE_ALL, "population_total"],
      [AGE_WORKING, "population_working_age"],
    ] as const) {
      const obs = await fetchNomisData(DATASET_ID, {
        geography,
        date,
        sex: "7",
        age: String(age),
        measures: "20100",
      });
      for (const o of obs) {
        if (!laByGeogCode.has(o.geogcode)) continue;
        observations.push({
          laCode: o.geogcode,
          domain: "population",
          metric,
          period: o.time,
          periodType: "annual",
          value: o.value,
          unit: "persons",
        });
      }
    }

    return {
      source: DATASET_ID,
      sourceUrl: SOURCE_URL,
      domain: "population",
      observations,
    };
  },
};
