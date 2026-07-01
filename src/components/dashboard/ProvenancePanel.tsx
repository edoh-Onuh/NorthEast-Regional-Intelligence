"use client";

import { useState } from "react";
import { ChevronDown, CircleCheck, CircleAlert, CircleX, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { Checkpoint } from "@/lib/db/queries";

const STATUS_ICON: Record<string, typeof CircleCheck> = {
  success: CircleCheck,
  partial: CircleAlert,
  failed: CircleX,
};

const STATUS_COLOR: Record<string, string> = {
  success: "text-positive",
  partial: "text-[var(--accent-sunderland)]",
  failed: "text-negative",
};

export function ProvenancePanel({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-3 pb-4 sm:px-6">
      <div className="rounded-xl border border-surface-border bg-surface">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Data provenance &amp; ingestion checkpoints ({checkpoints.length} source
            {checkpoints.length === 1 ? "" : "s"})
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-foreground-subtle transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {open && (
          <div className="overflow-x-auto border-t border-surface-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-foreground-subtle">
                  <th className="px-4 py-2 font-medium">Domain</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Rows</th>
                  <th className="px-4 py-2 font-medium">Last run</th>
                </tr>
              </thead>
              <tbody>
                {checkpoints.map((c, i) => {
                  const Icon = STATUS_ICON[c.status] ?? CircleAlert;
                  return (
                    <tr key={i} className="border-t border-surface-border">
                      <td className="whitespace-nowrap px-4 py-2 capitalize text-foreground">{c.domain}</td>
                      <td className="px-4 py-2 text-foreground-muted">{c.source}</td>
                      <td className={cn("px-4 py-2", STATUS_COLOR[c.status])}>
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-foreground-muted">{c.rowsWritten}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-foreground-muted">
                        {formatDateTime(c.finishedAt)}
                      </td>
                    </tr>
                  );
                })}
                {checkpoints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-foreground-subtle">
                      No ingestion has run yet. Run <code>npm run seed</code> or wait for the next
                      scheduled cron trigger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
