import { describe, expect, it } from "vitest";
import { recentMonths, recentQuarterLabels, recentYears } from "./dateRanges";

describe("recentMonths", () => {
  it("returns the requested count, ascending, YYYY-MM format", () => {
    const months = recentMonths(6, 2);
    expect(months).toHaveLength(6);
    expect(months.every((m) => /^\d{4}-\d{2}$/.test(m))).toBe(true);
    expect(months).toEqual([...months].sort());
  });
});

describe("recentQuarterLabels", () => {
  it("only returns valid NOMIS quarter-end labels (03/06/09/12)", () => {
    const labels = recentQuarterLabels(8, 1);
    expect(labels).toHaveLength(8);
    for (const label of labels) {
      const month = label.split("-")[1];
      expect(["03", "06", "09", "12"]).toContain(month);
    }
    expect(labels).toEqual([...labels].sort());
  });
});

describe("recentYears", () => {
  it("returns ascending YYYY strings ending `lagYears` before now", () => {
    const years = recentYears(5, 1);
    expect(years).toHaveLength(5);
    const currentYear = new Date().getUTCFullYear();
    expect(years[years.length - 1]).toBe(String(currentYear - 1));
    expect(years).toEqual([...years].sort());
  });
});
