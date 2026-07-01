import { NORTH_EAST_LAS } from "@/lib/geographies";
import type { DataSourceFetcher, RawObservation, SourceFetchResult } from "./types";

const INDICATOR_ID = "90366"; // Life expectancy at birth
const AREA_TYPE_ID = "502"; // Upper tier local authorities (post 4/23)
const SOURCE_URL =
  "https://fingertips.phe.org.uk/profile/health-profiles";

const CSV_URL = `https://fingertips.phe.org.uk/api/all_data/csv/by_indicator_id?indicator_ids=${INDICATOR_ID}&area_type_id=${AREA_TYPE_ID}`;

/** Splits one CSV line into fields, honouring double-quoted values containing commas. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Fingertips labels rolling multi-year periods with an abbreviated end year,
 * e.g. "2021 - 23" (meaning 2021 to 2023). Normalize to the full end year
 * ("2023") so periods sort/compare consistently with single-year labels
 * like "2025". Falls back to the raw (trimmed) string for any other shape.
 */
export function normalizePeriod(raw: string): string {
  const trimmed = raw.trim();

  const rangeMatch = /^(\d{4})\s*-\s*(\d{2,4})$/.exec(trimmed);
  if (rangeMatch) {
    const [, startYear, endPart] = rangeMatch;
    if (endPart.length === 4) return endPart;
    return `${startYear.slice(0, 2)}${endPart}`;
  }

  return trimmed;
}

/**
 * Life expectancy at birth (male/female), by local authority, from the OHID
 * Fingertips public health API. Fingertips has no per-area server-side
 * filter for this endpoint, so we download the full England-wide indicator
 * CSV once (a few tens of MB, fetched at most once per scheduled run) and
 * filter to our 7 local authorities client-side.
 */
export const healthFetcher: DataSourceFetcher = {
  key: "fingertips-life-expectancy",
  domain: "health",
  label: "Life Expectancy at Birth (OHID Fingertips)",

  async fetch(): Promise<SourceFetchResult> {
    const res = await fetch(CSV_URL, { headers: { Accept: "text/csv" }, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Fingertips request failed with HTTP ${res.status}`);
    }
    const text = await res.text();
    const laCodes = new Set(NORTH_EAST_LAS.map((la) => la.code));

    const lines = text.split("\n");
    if (lines.length === 0) {
      return { source: "OHID Fingertips", sourceUrl: SOURCE_URL, domain: "health", observations: [] };
    }

    const header = parseCsvLine(lines[0]);
    const idx = {
      areaCode: header.indexOf("Area Code"),
      sex: header.indexOf("Sex"),
      period: header.indexOf("Time period"),
      value: header.indexOf("Value"),
    };
    if (Object.values(idx).some((i) => i === -1)) {
      throw new Error("Fingertips CSV header shape changed — expected columns not found");
    }

    const observations: RawObservation[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || ![...laCodes].some((code) => line.includes(code))) continue;

      const fields = parseCsvLine(line);
      const areaCode = fields[idx.areaCode];
      if (!laCodes.has(areaCode)) continue;

      const sex = fields[idx.sex];
      const metric = sex === "Male" ? "life_expectancy_male" : sex === "Female" ? "life_expectancy_female" : null;
      if (!metric) continue;

      const value = Number(fields[idx.value]);
      if (!Number.isFinite(value)) continue;

      observations.push({
        laCode: areaCode,
        domain: "health",
        metric,
        period: normalizePeriod(fields[idx.period]),
        periodType: "annual",
        value,
        unit: "years",
      });
    }

    return {
      source: "OHID Fingertips (indicator 90366)",
      sourceUrl: SOURCE_URL,
      domain: "health",
      observations,
    };
  },
};
