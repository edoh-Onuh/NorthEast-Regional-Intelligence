/** Generates "YYYY-MM" strings for the last `months` months, ending `lagMonths` before now. */
export function recentMonths(months: number, lagMonths = 2): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - lagMonths);
  for (let i = 0; i < months; i++) {
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out.reverse();
}

/**
 * NOMIS's Annual Population Survey datasets (e.g. NM_17_5) only publish
 * rolling-12-month periods labelled by end quarter: "2024-12" (Jan-Dec 2024),
 * "2025-03" (Apr2024-Mar2025), "2025-06", "2025-09", etc. Arbitrary months
 * return no data, so we must request one of these four quarter-end labels.
 */
export function recentQuarterLabels(count: number, lagQuarters = 1): string[] {
  const quarterEndMonths = [3, 6, 9, 12];
  const out: string[] = [];
  const d = new Date();
  // Snap to the most recent quarter-end month, then step back `lagQuarters`.
  let year = d.getUTCFullYear();
  let qIdx = quarterEndMonths.findIndex((m) => m >= d.getUTCMonth() + 1);
  if (qIdx === -1) qIdx = 0;
  for (let i = 0; i < lagQuarters; i++) {
    qIdx -= 1;
    if (qIdx < 0) {
      qIdx = quarterEndMonths.length - 1;
      year -= 1;
    }
  }
  for (let i = 0; i < count; i++) {
    out.push(`${year}-${String(quarterEndMonths[qIdx]).padStart(2, "0")}`);
    qIdx -= 1;
    if (qIdx < 0) {
      qIdx = quarterEndMonths.length - 1;
      year -= 1;
    }
  }
  return out.reverse();
}

/** "YYYY" strings for the last `years` years, ending `lagYears` before now. */
export function recentYears(years: number, lagYears = 1): string[] {
  const currentYear = new Date().getUTCFullYear();
  const out: string[] = [];
  for (let i = 0; i < years; i++) out.push(String(currentYear - lagYears - i));
  return out.reverse();
}
