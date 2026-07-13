"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
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
 * Each bar is labelled with its value at the tip, so the numeric axis is
 * dropped as redundant.
 */
export function ComparisonBarChart({ latest, metric }: Props) {
  if (latest.length === 0) return <ChartEmptyState />;

  const data = latest
    .map((p) => ({ laCode: p.laCode, name: laShortName(p.laCode), value: p.value }))
    .sort((a, b) => b.value - a.value);
  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const hasPolarity = metric.higherIsBetter !== null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 52, left: 0, bottom: 0 }} barCategoryGap="22%">
        {/* Value axis is hidden: every bar is directly labelled at its tip. */}
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "var(--foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={82}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-border)", fillOpacity: 0.25 }}
          content={<ChartTooltip valueFormatter={(v) => formatValue(v, metric.format)} />}
        />
        {hasPolarity && (
          <ReferenceLine
            x={mean}
            stroke="var(--foreground-subtle)"
            strokeDasharray="5 4"
            label={{
              value: "avg",
              position: "top",
              fill: "var(--foreground-subtle)",
              fontSize: 10,
            }}
          />
        )}
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
          {data.map((d) => {
            let fill = "var(--accent-newcastle)";
            if (hasPolarity) {
              const aboveMean = d.value >= mean;
              const isGood = metric.higherIsBetter ? aboveMean : !aboveMean;
              fill = isGood ? "var(--positive)" : "var(--negative)";
            }
            return <Cell key={d.laCode} fill={fill} />;
          })}
          <LabelList
            dataKey="value"
            position="right"
            offset={8}
            formatter={(v) => formatValue(Number(v), metric.format)}
            style={{ fill: "var(--foreground-muted)", fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
