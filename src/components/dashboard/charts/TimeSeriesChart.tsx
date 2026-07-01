"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NORTH_EAST_LAS } from "@/lib/geographies";
import { formatPeriod, formatValue } from "@/lib/format";
import type { MetricMeta } from "@/lib/catalog";
import type { SeriesPoint } from "@/lib/db/queries";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  points: SeriesPoint[];
  metric: MetricMeta;
}

function pivotByPeriod(points: SeriesPoint[]) {
  const byPeriod = new Map<string, Record<string, number | string>>();
  for (const p of points) {
    if (!byPeriod.has(p.period)) byPeriod.set(p.period, { period: p.period });
    byPeriod.get(p.period)![p.laCode] = p.value;
  }
  return Array.from(byPeriod.values()).sort((a, b) =>
    String(a.period).localeCompare(String(b.period))
  );
}

export function TimeSeriesChart({ points, metric }: Props) {
  if (points.length === 0) return <ChartEmptyState />;

  const data = pivotByPeriod(points);
  const activeLAs = NORTH_EAST_LAS.filter((la) => points.some((p) => p.laCode === la.code));
  const isArea = metric.chart === "area";
  const Chart = isArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Chart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        {isArea && (
          <defs>
            {activeLAs.map((la) => (
              <linearGradient key={la.code} id={`grad-${la.code}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={la.colorVar} stopOpacity={0.28} />
                <stop offset="95%" stopColor={la.colorVar} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
        <XAxis
          dataKey="period"
          tickFormatter={formatPeriod}
          tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--surface-border)" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--surface-border)" }}
          width={56}
          tickFormatter={(v: number) => formatValue(v, metric.format === "currency-gbp" ? "number" : metric.format)}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={formatPeriod}
              valueFormatter={(v) => formatValue(v, metric.format)}
              nameFormatter={(code) => NORTH_EAST_LAS.find((la) => la.code === code)?.shortName ?? code}
            />
          }
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--foreground-muted)" }}
          formatter={(code: string) => NORTH_EAST_LAS.find((la) => la.code === code)?.shortName ?? code}
        />
        {activeLAs.map((la) =>
          isArea ? (
            <Area
              key={la.code}
              type="monotone"
              dataKey={la.code}
              name={la.code}
              stroke={la.colorVar}
              strokeWidth={2}
              fill={`url(#grad-${la.code})`}
              connectNulls
            />
          ) : (
            <Line
              key={la.code}
              type="monotone"
              dataKey={la.code}
              name={la.code}
              stroke={la.colorVar}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
