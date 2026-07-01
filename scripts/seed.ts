/**
 * One-off/backfill runner: executes the same ingestion pipeline the Vercel
 * Cron job triggers in production, but directly against DATABASE_URL from
 * your local environment. Use this to populate a fresh database immediately
 * after provisioning, instead of waiting for the next scheduled run.
 *
 * Usage: npm run seed   (reads ./.env via `tsx --env-file=.env`)
 */
import { runIngestion } from "../src/lib/ingest/runIngestion";
import { ALL_FETCHERS } from "../src/lib/ingest/fetchers";

async function main() {
  console.log(`Seeding ${ALL_FETCHERS.length} data source(s)...`);
  const outcomes = await runIngestion(ALL_FETCHERS);

  for (const outcome of outcomes) {
    const icon = outcome.status === "success" ? "OK" : outcome.status === "partial" ? "WARN" : "FAIL";
    console.log(`[${icon}] ${outcome.key} (${outcome.domain}): ${outcome.rowsWritten} rows`);
    if (outcome.errorMessage) console.log(`       ${outcome.errorMessage}`);
  }

  const failed = outcomes.filter((o) => o.status === "failed");
  if (failed.length > 0) {
    console.error(`${failed.length} source(s) failed.`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
