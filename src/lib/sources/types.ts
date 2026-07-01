import type { IndicatorDomain } from "@/lib/db/schema";

export interface RawObservation {
  laCode: string;
  domain: IndicatorDomain;
  metric: string;
  period: string;
  periodType: "annual" | "monthly" | "quarterly";
  value: number;
  unit?: string;
}

export interface SourceFetchResult {
  source: string;
  sourceUrl: string;
  domain: IndicatorDomain;
  observations: RawObservation[];
}

export interface DataSourceFetcher {
  key: string;
  domain: IndicatorDomain;
  label: string;
  fetch(): Promise<SourceFetchResult>;
}
