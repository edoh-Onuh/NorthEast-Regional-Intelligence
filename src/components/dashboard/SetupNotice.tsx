import { DatabaseZap } from "lucide-react";

export function SetupNotice({ error }: { error: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-lg rounded-2xl border border-surface-border bg-surface p-6 text-center sm:p-8">
        <DatabaseZap className="mx-auto h-8 w-8 text-foreground-subtle" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-foreground">Database not reachable</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          This dashboard reads from a Postgres database that hasn&apos;t been provisioned yet, or
          <code className="mx-1 rounded bg-background px-1 py-0.5 text-xs">DATABASE_URL</code>
          isn&apos;t set in your environment.
        </p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-left text-sm text-foreground-muted">
          <li>Provision a Postgres database (Vercel Postgres, Neon, or Supabase all work).</li>
          <li>
            Copy <code className="rounded bg-background px-1 py-0.5 text-xs">.env.example</code> to{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">.env</code> and set{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">DATABASE_URL</code>.
          </li>
          <li>
            Run <code className="rounded bg-background px-1 py-0.5 text-xs">npm run db:generate &amp;&amp; npm run db:migrate</code>.
          </li>
          <li>
            Run <code className="rounded bg-background px-1 py-0.5 text-xs">npm run seed</code> to
            backfill real data immediately.
          </li>
        </ol>
        {process.env.NODE_ENV !== "production" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-foreground-subtle">
              Technical detail (hidden in production)
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-[11px] text-foreground-muted">
              {error}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
