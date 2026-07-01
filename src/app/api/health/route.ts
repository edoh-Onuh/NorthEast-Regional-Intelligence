import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Unauthenticated liveness/readiness probe: confirms the DB is reachable. No sensitive data returned. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
