"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
     
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-surface-border bg-surface p-6 text-center sm:p-8">
        <AlertOctagon className="mx-auto h-8 w-8 text-negative" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          An unexpected error occurred while rendering this page. No sensitive details are shown here;
          check server logs for the full trace.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg bg-[var(--accent-newcastle)] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
