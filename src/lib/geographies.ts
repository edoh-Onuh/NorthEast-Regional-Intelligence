/**
 * Reference data for the seven North East England local authorities covered
 * by this platform. Codes are official ONS/GSS administrative codes
 * (https://geoportal.statistics.gov.uk/) and NOMIS internal geography IDs
 * (resolved via the NOMIS geography hierarchy API, TYPE434 = LAD as of 2019).
 */

export type PoliceForce = "northumbria" | "durham";

export interface LocalAuthority {
  /** ONS/GSS administrative code, e.g. E08000021 */
  code: string;
  name: string;
  shortName: string;
  /** NOMIS internal geography id used in NM_* dataset queries */
  nomisId: string;
  policeForce: PoliceForce;
  /** CSS custom property (see globals.css) so chart colours adapt to light/dark theme. */
  colorVar: string;
}

export const NORTH_EAST_LAS: LocalAuthority[] = [
  { code: "E08000021", name: "Newcastle upon Tyne", shortName: "Newcastle", nomisId: "1820327945", policeForce: "northumbria", colorVar: "var(--accent-newcastle)" },
  { code: "E08000037", name: "Gateshead", shortName: "Gateshead", nomisId: "1820327944", policeForce: "northumbria", colorVar: "var(--accent-gateshead)" },
  { code: "E08000024", name: "Sunderland", shortName: "Sunderland", nomisId: "1820327948", policeForce: "northumbria", colorVar: "var(--accent-sunderland)" },
  { code: "E06000047", name: "County Durham", shortName: "Durham", nomisId: "1820327938", policeForce: "durham", colorVar: "var(--accent-durham)" },
  { code: "E08000023", name: "South Tyneside", shortName: "S. Tyneside", nomisId: "1820327947", policeForce: "northumbria", colorVar: "var(--accent-southtyneside)" },
  { code: "E08000022", name: "North Tyneside", shortName: "N. Tyneside", nomisId: "1820327946", policeForce: "northumbria", colorVar: "var(--accent-northtyneside)" },
  { code: "E06000057", name: "Northumberland", shortName: "Northumberland", nomisId: "1820327941", policeForce: "northumbria", colorVar: "var(--accent-northumberland)" },
];

export const LA_BY_CODE: Record<string, LocalAuthority> = Object.fromEntries(
  NORTH_EAST_LAS.map((la) => [la.code, la])
);

export function laShortName(code: string): string {
  return LA_BY_CODE[code]?.shortName ?? code;
}
