import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const INDICATOR_DOMAINS = [
  "economy",
  "business",
  "labour",
  "skills",
  "population",
  "housing",
  "health",
  "crime",
] as const;
export type IndicatorDomain = (typeof INDICATOR_DOMAINS)[number];

export const localAuthorities = pgTable("local_authorities", {
  code: varchar("code", { length: 9 }).primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  nomisId: text("nomis_id"),
  policeForce: text("police_force"),
  colorVar: varchar("color_var", { length: 40 }).notNull(),
});

/**
 * Normalized long-format time series store. Every real-world metric we ingest
 * (GVA, claimant rate, life expectancy, ...) lands here as one row per
 * (local authority, domain, metric, period) so the UI queries a single table
 * regardless of how many upstream sources exist.
 */
export const indicatorObservations = pgTable(
  "indicator_observations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    laCode: varchar("la_code", { length: 9 })
      .notNull()
      .references(() => localAuthorities.code),
    domain: text("domain").notNull().$type<IndicatorDomain>(),
    metric: text("metric").notNull(),
    period: text("period").notNull(),
    periodType: text("period_type").notNull().$type<"annual" | "monthly" | "quarterly">(),
    value: numeric("value", { precision: 16, scale: 4 }).notNull(),
    unit: text("unit"),
    sourceDataset: text("source_dataset").notNull(),
    sourceUrl: text("source_url"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uniq_observation").on(t.laCode, t.domain, t.metric, t.period),
    index("idx_observation_domain").on(t.domain),
    index("idx_observation_metric").on(t.metric),
  ]
);

/**
 * Audit trail / "checkpoints" for the ingestion pipeline: one row per
 * source-domain run, so data provenance and freshness are inspectable
 * both in-app and for the security/ops audit.
 */
export const ingestionRuns = pgTable("ingestion_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  domain: text("domain").notNull().$type<IndicatorDomain>(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().$type<"success" | "partial" | "failed">(),
  rowsWritten: integer("rows_written").notNull().default(0),
  errorMessage: text("error_message"),
});
