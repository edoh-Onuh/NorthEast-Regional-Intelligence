import { describe, expect, it } from "vitest";
import { formatValue, formatPeriod } from "./format";

describe("formatValue", () => {
  it("formats currency-gbp", () => {
    expect(formatValue(12223, "currency-gbp")).toBe("£12,223");
  });
  it("formats percent", () => {
    expect(formatValue(65.1, "percent")).toBe("65.1%");
  });
  it("formats plain numbers with grouping", () => {
    expect(formatValue(313522, "number")).toBe("313,522");
  });
});

describe("formatPeriod", () => {
  it("passes through bare years", () => {
    expect(formatPeriod("2023")).toBe("2023");
  });
  it("formats YYYY-MM as short month + year", () => {
    expect(formatPeriod("2024-03")).toBe("Mar 2024");
  });
  it("falls back to the raw string for unrecognized shapes", () => {
    expect(formatPeriod("2021 - 23")).toBe("2021 - 23");
  });
});
