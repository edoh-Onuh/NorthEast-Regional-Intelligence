"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { laShortName } from "@/lib/geographies";
import { formatValue } from "@/lib/format";
import type { MetricMeta } from "@/lib/catalog";
import type { SeriesPoint } from "@/lib/db/queries";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  latest: SeriesPoint[];
  metric: MetricMeta;
}

/**
 * Horizontal bar comparing the most recent value across all 7 local
 * authorities for one metric, with a reference line at the cross-LA mean.
 * Bars below the mean for a "higherIsBetter" metric render in the negative
 * colour and vice versa, so direction of travel is legible at a glance.
 */
export function ComparisonBarChart({ latest, metric }: Props) {
  if (latest.length === 0) return <ChartEmptyState />;

  const data = latest
    .map((p) => ({ laCode: p.laCode, name: laShortName(p.laCode), value: p.value }))
    .sort((a, b) => b.value - a.value);
  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--surface-border)" }}
          tickFormatter={(v: number) => formatValue(v, metric.format)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "var(--foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--surface-border)" }}
          width={82}
        />
        <Tooltip content={<ChartTooltip valueFormatter={(v) => formatValue(v, metric.format)} />} />
        {metric.higherIsBetter !== null && (
          <ReferenceLine x={mean} stroke="var(--foreground-subtle)" strokeDasharray="6 3" />
        )}
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((d) => {
            let fill = "var(--accent-newcastle)";
            if (metric.higherIsBetter !== null) {
              const aboveMean = d.value >= mean;
              const isGood = metric.higherIsBetter ? aboveMean : !aboveMean;
              fill = isGood ? "var(--positive)" : "var(--negative)";
            }
            return <Cell key={d.laCode} fill={fill} fillOpacity={0.85} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
