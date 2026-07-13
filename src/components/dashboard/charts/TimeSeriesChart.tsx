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
      <Chart data={data} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
        {isArea && (
          <defs>
            {activeLAs.map((la) => (
              <linearGradient key={la.code} id={`grad-${la.code}`} x1="0" y1="0" x2="0" y2="1">
                {/* ~12% wash at the top fading to transparent — the line leads, the fill only hints at magnitude. */}
                <stop offset="0%" stopColor={la.colorVar} stopOpacity={0.14} />
                <stop offset="90%" stopColor={la.colorVar} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
        )}
        {/* Recessive horizontal-only hairline grid (solid, one step off surface). */}
        <CartesianGrid vertical={false} stroke="var(--surface-border)" strokeOpacity={0.6} />
        <XAxis
          dataKey="period"
          tickFormatter={formatPeriod}
          tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--surface-border)" }}
          tickLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => formatValue(v, metric.format === "currency-gbp" ? "number" : metric.format)}
        />
        <Tooltip
          cursor={{ stroke: "var(--foreground-subtle)", strokeWidth: 1, strokeDasharray: "4 4" }}
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
          wrapperStyle={{ fontSize: 11, color: "var(--foreground-muted)", paddingTop: 8 }}
          formatter={(code: string) => (
            <span style={{ color: "var(--foreground-muted)" }}>
              {NORTH_EAST_LAS.find((la) => la.code === code)?.shortName ?? code}
            </span>
          )}
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
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#grad-${la.code})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
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
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              connectNulls
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
