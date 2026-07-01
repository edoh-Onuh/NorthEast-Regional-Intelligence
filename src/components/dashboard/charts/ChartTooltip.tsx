"use client";

interface TooltipPayloadEntry {
  color?: string;
  name?: string;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadEntry[];
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
  nameFormatter?: (name: string) => string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
  nameFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-xs shadow-lg">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
        {labelFormatter && label !== undefined ? labelFormatter(String(label)) : label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-foreground-muted">
            {nameFormatter && entry.name ? nameFormatter(entry.name) : entry.name}:
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {typeof entry.value === "number" && valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
