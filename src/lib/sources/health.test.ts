import { describe, expect, it } from "vitest";
import { parseCsvLine, normalizePeriod } from "./health";

describe("parseCsvLine", () => {
  it("splits simple comma-separated values", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("honours quoted fields containing commas", () => {
    expect(parseCsvLine('90366,"Life expectancy, at birth",E08000021,Male,78.3')).toEqual([
      "90366",
      "Life expectancy, at birth",
      "E08000021",
      "Male",
      "78.3",
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsvLine('"Value note: ""provisional"" data",78.3')).toEqual([
      'Value note: "provisional" data',
      "78.3",
    ]);
  });
});

describe("normalizePeriod", () => {
  it("extracts the end year from a rolling range", () => {
    expect(normalizePeriod("2021 - 23")).toBe("2023");
  });
  it("passes through a bare year", () => {
    expect(normalizePeriod("2025")).toBe("2025");
  });
});
