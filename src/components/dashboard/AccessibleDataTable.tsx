import { laShortName } from "@/lib/geographies";
import { formatPeriod, formatValue } from "@/lib/format";
import type { MetricMeta } from "@/lib/catalog";
import type { SeriesPoint } from "@/lib/db/queries";

/**
 * Visually-hidden table mirroring each chart's data, so screen-reader users
 * (for whom the SVG chart is largely opaque) get the same information as
 * sighted users. Kept off-screen with `sr-only` rather than removed, per
 * WCAG guidance for non-text content with a text alternative.
 */
export function AccessibleDataTable({ points, metric }: { points: SeriesPoint[]; metric: MetricMeta }) {
  if (points.length === 0) return null;
  const rows = [...points].sort((a, b) => a.period.localeCompare(b.period));

  return (
    <table className="sr-only">
      <caption>{`${metric.label} (${metric.unit}) by local authority and period`}</caption>
      <thead>
        <tr>
          <th scope="col">Local authority</th>
          <th scope="col">Period</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => (
          <tr key={i}>
            <td>{laShortName(p.laCode)}</td>
            <td>{formatPeriod(p.period)}</td>
            <td>{formatValue(p.value, metric.format)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
