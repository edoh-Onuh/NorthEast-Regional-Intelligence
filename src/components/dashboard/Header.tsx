import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="border-b border-surface-border bg-gradient-to-b from-surface to-background px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              North East Regional Intelligence
            </h1>
            <span className="rounded-md bg-[color-mix(in_oklab,var(--accent-newcastle)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-newcastle)]">
              Live ONS &amp; NOMIS data
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-foreground-muted sm:text-sm">
            Economic output, business demography, labour market, skills, population, housing and health
            across Newcastle, Gateshead, Sunderland, County Durham, North &amp; South Tyneside and
            Northumberland.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
