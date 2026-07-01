"use client";

import { cn } from "@/lib/cn";
import type { DomainMeta } from "@/lib/catalog";
import type { IndicatorDomain } from "@/lib/db/schema";

interface Props {
  domains: DomainMeta[];
  active: IndicatorDomain;
  onChange: (key: IndicatorDomain) => void;
}

export function TabNav({ domains, active, onChange }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b border-surface-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        role="tablist"
        aria-label="Regional intelligence domains"
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2.5 sm:px-6"
        style={{ scrollbarWidth: "none" }}
      >
        {domains.map((domain) => {
          const isActive = domain.key === active;
          return (
            <button
              key={domain.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onChange(domain.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[color-mix(in_oklab,var(--accent-newcastle)_16%,transparent)] text-[var(--accent-newcastle)]"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              {domain.shortLabel}
              {domain.cadence === "unavailable" && (
                <span aria-hidden="true" className="ml-1 text-foreground-subtle">
                  ·
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
