/**
 * Thin client for the NOMIS API (nomisweb.co.uk), the official ONS-backed
 * labour market statistics service. No API key is required for the datasets
 * this project uses; Crown Copyright / Open Government Licence v3.0 applies.
 *
 * NOMIS query mechanics (reverse-engineered against the live API):
 *  - Each dataset has dimensions (GEOGRAPHY, GENDER, AGE, MEASURE, ...) whose
 *    valid numeric codes are discoverable at
 *    /api/v01/dataset/{id}/{dimension}.def.sdmx.json
 *  - Data queries hit /api/v01/dataset/{id}.data.json with one query param
 *    per dimension plus `measures` (the "MEASURES" attribute, 20100 = Value)
 *    and `date` (explicit YYYY-MM/YYYY or comma lists; `latest` can return
 *    provisional/suppressed placeholder rows so explicit dates are safer for
 *    backfills).
 *  - obs_status "A" means a normal, published value; anything else
 *    (commonly "Q" for not-yet-published or suppressed rows) has no usable
 *    obs_value and must be filtered out.
 */

const NOMIS_BASE = "https://www.nomisweb.co.uk/api/v01";

export interface NomisObservation {
  geogcode: string;
  time: string;
  value: number;
}

interface NomisRawObs {
  geography: { value: number; geogcode: string; description: string };
  // Annual datasets (e.g. NM_31_1) return a numeric year here; monthly/rolling
  // datasets (e.g. NM_162_1, NM_17_5) return a "YYYY-MM" string.
  time: { value: string | number };
  obs_value: { value: number | string };
  obs_status: { value: string };
}

interface NomisDataResponse {
  obs?: NomisRawObs[];
  error?: string;
}

export class NomisRequestError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = "NomisRequestError";
  }
}

/**
 * Fetch a NOMIS dataset query and return only normally-published
 * observations, already coerced to numbers.
 */
export async function fetchNomisData(
  datasetId: string,
  params: Record<string, string>
): Promise<NomisObservation[]> {
  const query = new URLSearchParams(params);
  const url = `${NOMIS_BASE}/dataset/${datasetId}.data.json?${query.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new NomisRequestError(`NOMIS request failed with HTTP ${res.status}`, url);
  }

  const body = (await res.json()) as NomisDataResponse;

  if (body.error) {
    // "Query returned no data" is a valid (empty) result, not a hard failure.
    if (body.error.includes("no data")) return [];
    throw new NomisRequestError(`NOMIS error: ${body.error}`, url);
  }

  return (body.obs ?? [])
    .filter((o) => o.obs_status?.value === "A" && o.obs_value?.value !== "")
    .map((o) => ({
      geogcode: o.geography.geogcode,
      time: String(o.time.value),
      value: Number(o.obs_value.value),
    }));
}
