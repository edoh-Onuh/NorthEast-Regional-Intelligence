import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runIngestion } from "@/lib/ingest/runIngestion";
import { ALL_FETCHERS } from "@/lib/ingest/fetchers";
import { checkIngestRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** SHA-256 first so both sides of the comparison are always fixed-length, then compare in constant time. */
function constantTimeEquals(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: an unconfigured secret means the endpoint accepts nothing.
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return constantTimeEquals(auth, `Bearer ${secret}`);
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

/**
 * Triggered by Vercel Cron (see vercel.json) and callable manually with the
 * same bearer secret for ad-hoc backfills. Vercel Cron sends GET requests
 * with `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET
 * is configured as a project environment variable.
 */
async function handleIngest(request: NextRequest) {
  const { success } = await checkIngestRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional ?domains=housing,health filter so slow/heavy sources (e.g. the
  // Fingertips health CSV) can run on a lighter, less frequent cron schedule
  // than fast daily sources — see vercel.json for the two schedules.
  const domainsParam = request.nextUrl.searchParams.get("domains");
  const fetchers = domainsParam
    ? ALL_FETCHERS.filter((f) => domainsParam.split(",").includes(f.domain))
    : ALL_FETCHERS;

  const outcomes = await runIngestion(fetchers);
  const anyFailed = outcomes.some((o) => o.status === "failed");

  return NextResponse.json(
    { ranAt: new Date().toISOString(), outcomes },
    { status: anyFailed ? 207 : 200 }
  );
}

export async function GET(request: NextRequest) {
  return handleIngest(request);
}

export async function POST(request: NextRequest) {
  return handleIngest(request);
}
