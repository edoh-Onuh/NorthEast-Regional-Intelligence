import type { IndicatorDomain } from "@/lib/db/schema";

export interface DomainMeta {
  key: IndicatorDomain;
  label: string;
  shortLabel: string;
  description: string;
  /** Cadence note shown in the UI: "live" domains refresh via the daily cron. */
  cadence: "live" | "annual-manual" | "unavailable";
  /** Shown when cadence is "annual-manual" or "unavailable" to explain why. */
  cadenceNote?: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    key: "economy",
    label: "Economic Output",
    shortLabel: "Economy",
    description: "Regional gross value added by local authority.",
    cadence: "annual-manual",
    cadenceNote:
      "ONS publishes local authority GVA only as an annual bulletin release (no live API), roughly a year in arrears. Figures shown are the real published values from the most recent release and are refreshed manually when ONS issues a new edition.",
  },
  {
    key: "business",
    label: "Business Demography",
    shortLabel: "Business",
    description: "Active enterprise stock by local authority.",
    cadence: "live",
  },
  {
    key: "labour",
    label: "Labour Market",
    shortLabel: "Labour Market",
    description: "Claimant count and employment rate.",
    cadence: "live",
  },
  {
    key: "skills",
    label: "Skills & Qualifications",
    shortLabel: "Skills",
    description: "Working-age qualification levels (Annual Population Survey).",
    cadence: "live",
    cadenceNote:
      "Small local authorities are sometimes suppressed by ONS for a given period due to Annual Population Survey sample-size disclosure rules; gaps in the chart reflect genuine suppression, not a fetch error.",
  },
  {
    key: "population",
    label: "Population & Demographics",
    shortLabel: "Population",
    description: "Mid-year population estimates and working-age structure.",
    cadence: "live",
  },
  {
    key: "housing",
    label: "Housing",
    shortLabel: "Housing",
    description: "UK House Price Index by local authority.",
    cadence: "live",
  },
  {
    key: "health",
    label: "Health",
    shortLabel: "Health",
    description: "Life expectancy at birth by local authority.",
    cadence: "live",
  },
  {
    key: "crime",
    label: "Crime",
    shortLabel: "Crime",
    description: "Recorded crime by area.",
    cadence: "unavailable",
    cadenceNote:
      "No free, reliable local-authority-level live crime API currently exists: data.police.uk only exposes point-radius (\"street-level\") or location-less crime subsets, not force- or LA-wide totals, and ONS's Community-Safety-Partnership crime tables are bulletin-only (no API). Rather than publish a misleading proxy figure, this section is intentionally left without data until a trustworthy source is available.",
  },
];

export type ChartKind = "line" | "bar" | "area" | "stackedBar";

export interface MetricMeta {
  domain: IndicatorDomain;
  key: string;
  label: string;
  unit: string;
  format: "number" | "currency-gbp" | "percent" | "rate";
  chart: ChartKind;
  higherIsBetter: boolean | null;
  description: string;
}

export const METRICS: MetricMeta[] = [
  // Economy
  { domain: "economy", key: "gva_total", label: "GVA (current prices)", unit: "GBP millions", format: "currency-gbp", chart: "line", higherIsBetter: true, description: "Regional gross value added (balanced), current prices, total all industries." },

  // Business
  { domain: "business", key: "active_enterprises", label: "Active Enterprises", unit: "count", format: "number", chart: "line", higherIsBetter: true, description: "Stock of active enterprises (UK Business Counts)." },

  // Labour
  { domain: "labour", key: "claimant_count", label: "Claimant Count", unit: "persons", format: "number", chart: "area", higherIsBetter: false, description: "Universal Credit + JSA claimants, all ages 16+." },
  { domain: "labour", key: "employment_rate", label: "Employment Rate", unit: "% aged 16-64", format: "percent", chart: "line", higherIsBetter: true, description: "Annual Population Survey employment rate." },

  // Skills
  { domain: "skills", key: "nvq4_pct", label: "NVQ4+ (Degree-level)", unit: "% working-age", format: "percent", chart: "bar", higherIsBetter: true, description: "Share of working-age population qualified to degree level or above." },
  { domain: "skills", key: "no_quals_pct", label: "No Qualifications", unit: "% working-age", format: "percent", chart: "bar", higherIsBetter: false, description: "Share of working-age population with no formal qualifications." },

  // Population
  { domain: "population", key: "population_total", label: "Total Population", unit: "persons", format: "number", chart: "line", higherIsBetter: null, description: "Mid-year population estimate." },
  { domain: "population", key: "population_working_age", label: "Working-Age Population", unit: "persons aged 16-64", format: "number", chart: "line", higherIsBetter: null, description: "Population aged 16-64." },

  // Housing
  { domain: "housing", key: "house_price_avg", label: "Average House Price", unit: "GBP", format: "currency-gbp", chart: "line", higherIsBetter: null, description: "UK House Price Index average price." },
  { domain: "housing", key: "house_price_change_pct", label: "Annual Price Change", unit: "% year-on-year", format: "percent", chart: "bar", higherIsBetter: null, description: "UK HPI 12-month percentage change." },

  // Health
  { domain: "health", key: "life_expectancy_male", label: "Life Expectancy (Male)", unit: "years at birth", format: "number", chart: "bar", higherIsBetter: true, description: "Male life expectancy at birth." },
  { domain: "health", key: "life_expectancy_female", label: "Life Expectancy (Female)", unit: "years at birth", format: "number", chart: "bar", higherIsBetter: true, description: "Female life expectancy at birth." },
];

export function metricsForDomain(domain: IndicatorDomain): MetricMeta[] {
  return METRICS.filter((m) => m.domain === domain);
}
