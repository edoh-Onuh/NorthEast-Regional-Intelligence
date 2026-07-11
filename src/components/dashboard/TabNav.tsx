"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import type { DomainMeta } from "@/lib/catalog";
import type { IndicatorDomain } from "@/lib/db/schema";

interface Props {
  domains: DomainMeta[];
  active: IndicatorDomain;
  onChange: (key: IndicatorDomain) => void;
}

/**
 * Domain switcher implementing the WAI-ARIA Tabs pattern with manual
 * activation semantics: roving tabindex, Arrow/Home/End keyboard navigation,
 * and full tab↔tabpanel wiring. All tabs share one swapping panel (the
 * <main id="main-content"> in Dashboard), so each tab's aria-controls points
 * to it and the panel's aria-labelledby tracks the active tab.
 * See w3.org/WAI/ARIA/apg/patterns/tabs.
 */
export function TabNav({ domains, active, onChange }: Props) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(index: number) {
    const clamped = (index + domains.length) % domains.length;
    const target = domains[clamped];
    onChange(target.key);
    tabRefs.current[clamped]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(domains.length - 1);
        break;
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-surface-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        role="tablist"
        aria-label="Regional intelligence domains"
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2.5 sm:px-6"
        style={{ scrollbarWidth: "none" }}
      >
        {domains.map((domain, index) => {
          const isActive = domain.key === active;
          return (
            <button
              key={domain.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`tab-${domain.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls="main-content"
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(domain.key)}
              onKeyDown={(e) => onKeyDown(e, index)}
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
