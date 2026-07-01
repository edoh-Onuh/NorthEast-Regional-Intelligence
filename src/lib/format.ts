import type { MetricMeta } from "@/lib/catalog";

const numberFormatter = new Intl.NumberFormat("en-GB");
const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatValue(value: number, format: MetricMeta["format"]): string {
  switch (format) {
    case "currency-gbp":
      return currencyFormatter.format(value);
    case "percent":
      return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
    case "rate":
      return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
    case "number":
    default:
      return numberFormatter.format(value);
  }
}

/** "2024" -> "2024"; "2024-03" -> "Mar 2024" */
export function formatPeriod(period: string): string {
  if (/^\d{4}$/.test(period)) return period;
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const [, year, month] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(date: Date | null): string {
  if (!date) return "never";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}
