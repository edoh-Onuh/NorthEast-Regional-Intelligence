import { NORTH_EAST_LAS } from "@/lib/geographies";
import { fetchNomisData } from "./nomisClient";
import { recentMonths } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const DATASET_ID = "NM_162_1";
const SOURCE_URL =
  "https://www.nomisweb.co.uk/datasets/ucjsa";

/**
 * Claimant count (Universal Credit + JSA claimants), total persons,
 * age 16+, monthly, by local authority. NOMIS dataset NM_162_1.
 */
export const claimantCountFetcher: DataSourceFetcher = {
  key: "nomis-claimant-count",
  domain: "labour",
  label: "Claimant Count (NOMIS NM_162_1)",

  async fetch(): Promise<SourceFetchResult> {
    const geography = NORTH_EAST_LAS.map((la) => la.nomisId).join(",");
    const date = recentMonths(24).join(",");

    const obs = await fetchNomisData(DATASET_ID, {
      geography,
      date,
      gender: "0",
      age: "0",
      measure: "1",
      measures: "20100",
    });

    const laByGeogCode = new Map(NORTH_EAST_LAS.map((la) => [la.code, la]));

    const observations: RawObservation[] = obs
      .filter((o) => laByGeogCode.has(o.geogcode))
      .map((o) => ({
        laCode: o.geogcode,
        domain: "labour",
        metric: "claimant_count",
        period: o.time,
        periodType: "monthly",
        value: o.value,
        unit: "persons",
      }));

    return {
      source: DATASET_ID,
      sourceUrl: SOURCE_URL,
      domain: "labour",
      observations,
    };
  },
};
