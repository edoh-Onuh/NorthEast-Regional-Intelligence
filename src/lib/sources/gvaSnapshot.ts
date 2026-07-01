import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const SOURCE_URL =
  "https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossvalueaddedbalancedbyindustrylocalauthoritiesbyitl1region";

/**
 * Regional GVA (balanced), current prices, £ millions, "Total, all
 * industries". ONS does not publish this via a live queryable API — it is
 * released as an annual bulletin (XLSX/CSV download only), roughly once a
 * year with a ~1 year lag, and the download URL changes with each release.
 *
 * These are real published figures (not fabricated), extracted from the
 * ONS "TLC North East" release published 2025-04-17, Table 3 ("current
 * prices, pounds million"), "Total" row per local authority. Because there
 * is no stable automatable source, this is a manually-refreshed snapshot
 * rather than a live-pipeline fetcher — update the OBSERVATIONS array and
 * RELEASE_DATE below whenever ONS publishes a new edition.
 */
const RELEASE_DATE = "2025-04-17";

const GVA_TOTAL_GBP_MILLIONS: Record<string, Record<string, number>> = {
  E08000021: { "2018": 9095, "2019": 9455, "2020": 8717, "2021": 9879, "2022": 10933, "2023": 12223 }, // Newcastle upon Tyne
  E08000037: { "2018": 4087, "2019": 4514, "2020": 3957, "2021": 4512, "2022": 4649, "2023": 5039 }, // Gateshead
  E08000024: { "2018": 6790, "2019": 7210, "2020": 6290, "2021": 6509, "2022": 7115, "2023": 7961 }, // Sunderland
  E06000047: { "2018": 8651, "2019": 9070, "2020": 9139, "2021": 9743, "2022": 10569, "2023": 12123 }, // County Durham
  E08000023: { "2018": 1803, "2019": 1905, "2020": 1707, "2021": 1946, "2022": 2061, "2023": 2206 }, // South Tyneside
  E08000022: { "2018": 4545, "2019": 4620, "2020": 4383, "2021": 4833, "2022": 5239, "2023": 6005 }, // North Tyneside
  E06000057: { "2018": 5032, "2019": 5378, "2020": 5072, "2021": 5514, "2022": 6089, "2023": 6605 }, // Northumberland
};

export const gvaSnapshotFetcher: DataSourceFetcher = {
  key: "ons-gva-manual-snapshot",
  domain: "economy",
  label: `ONS Regional GVA by Local Authority (manual snapshot, released ${RELEASE_DATE})`,

  async fetch(): Promise<SourceFetchResult> {
    const observations: RawObservation[] = [];
    for (const [laCode, years] of Object.entries(GVA_TOTAL_GBP_MILLIONS)) {
      for (const [year, value] of Object.entries(years)) {
        observations.push({
          laCode,
          domain: "economy",
          metric: "gva_total",
          period: year,
          periodType: "annual",
          value,
          unit: "GBP millions",
        });
      }
    }

    return {
      source: `ONS Regional GVA (balanced) by local authority — released ${RELEASE_DATE}`,
      sourceUrl: SOURCE_URL,
      domain: "economy",
      observations,
    };
  },
};
