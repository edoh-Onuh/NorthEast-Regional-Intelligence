import { NORTH_EAST_LAS } from "@/lib/geographies";
import { fetchNomisData } from "./nomisClient";
import { recentYears } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const DATASET_ID = "NM_142_1";
const SOURCE_URL = "https://www.nomisweb.co.uk/datasets/idbrent";

/**
 * Active enterprise stock by local authority, annual (UK Business Counts).
 * Note: NOMIS/ONS do not publish a live-queryable "business births/deaths"
 * (Business Demography) dataset — that release only exists as an annual ONS
 * bulletin download — so this fetcher covers active enterprise stock only,
 * which is still a genuine live indicator of business dynamism via its
 * year-on-year trend.
 */
export const businessCountsFetcher: DataSourceFetcher = {
  key: "nomis-uk-business-counts",
  domain: "business",
  label: "UK Business Counts (NOMIS NM_142_1)",

  async fetch(): Promise<SourceFetchResult> {
    const geography = NORTH_EAST_LAS.map((la) => la.nomisId).join(",");
    const date = recentYears(6).join(",");
    const laByGeogCode = new Map(NORTH_EAST_LAS.map((la) => [la.code, la]));

    const obs = await fetchNomisData(DATASET_ID, {
      geography,
      date,
      industry: "37748736", // Total, all industries
      legal_status: "0", // Total
      employment_sizeband: "0", // Total (otherwise NOMIS returns one row per sizeband)
      measures: "20100",
    });

    const observations: RawObservation[] = obs
      .filter((o) => laByGeogCode.has(o.geogcode))
      .map((o) => ({
        laCode: o.geogcode,
        domain: "business",
        metric: "active_enterprises",
        period: o.time,
        periodType: "annual",
        value: o.value,
        unit: "count",
      }));

    return {
      source: DATASET_ID,
      sourceUrl: SOURCE_URL,
      domain: "business",
      observations,
    };
  },
};
