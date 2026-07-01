import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkPageRateLimit } from "@/lib/rateLimit";

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function proxy(request: NextRequest) {
  const ip = clientIp(request);
  const { success, limit, remaining } = await checkPageRateLimit(ip);

  if (!success) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
