import { NORTH_EAST_LAS } from "@/lib/geographies";
import { recentMonths } from "./dateRanges";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const SOURCE_URL = "https://landregistry.data.gov.uk/app/ukhpi";

// HM Land Registry's Linked Data API slugs its "region" path segment from
// the local authority name; verified working for all 7 North East LAs.
const HPI_SLUG: Record<string, string> = {
  E08000021: "newcastle-upon-tyne",
  E08000037: "gateshead",
  E08000024: "sunderland",
  E06000047: "county-durham",
  E08000023: "south-tyneside",
  E08000022: "north-tyneside",
  E06000057: "northumberland",
};

interface HpiResponse {
  result?: {
    primaryTopic?: {
      averagePrice?: number;
      percentageAnnualChange?: number;
    };
  };
}

async function fetchOne(laCode: string, month: string): Promise<RawObservation[]> {
  const slug = HPI_SLUG[laCode];
  const url = `https://landregistry.data.gov.uk/data/ukhpi/region/${slug}/month/${month}.json`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return []; // some months simply don't exist yet for a given region; not fatal
  const body = (await res.json()) as HpiResponse;
  const topic = body.result?.primaryTopic;
  if (!topic || typeof topic.averagePrice !== "number") return [];

  const out: RawObservation[] = [
    {
      laCode,
      domain: "housing",
      metric: "house_price_avg",
      period: month,
      periodType: "monthly",
      value: topic.averagePrice,
      unit: "GBP",
    },
  ];
  if (typeof topic.percentageAnnualChange === "number") {
    out.push({
      laCode,
      domain: "housing",
      metric: "house_price_change_pct",
      period: month,
      periodType: "monthly",
      value: topic.percentageAnnualChange,
      unit: "percent",
    });
  }
  return out;
}

/**
 * UK House Price Index (HM Land Registry), average price and 12-month %
 * change, by local authority, monthly (~2 month publication lag). One HTTP
 * call per (LA, month); requests are batched by month with all 7 LAs in
 * parallel to keep total ingestion time bounded.
 */
export const housingFetcher: DataSourceFetcher = {
  key: "landregistry-ukhpi",
  domain: "housing",
  label: "UK House Price Index (HM Land Registry)",

  async fetch(): Promise<SourceFetchResult> {
    const months = recentMonths(12, 2);
    const observations: RawObservation[] = [];

    for (const month of months) {
      const batches = await Promise.all(
        NORTH_EAST_LAS.map((la) => fetchOne(la.code, month))
      );
      for (const batch of batches) observations.push(...batch);
    }

    return {
      source: "HM Land Registry UK HPI",
      sourceUrl: SOURCE_URL,
      domain: "housing",
      observations,
    };
  },
};
