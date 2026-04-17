import { NextResponse, type NextRequest } from "next/server";

import { isScanCronEnabled, validateCronAuthorizationHeader } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authResult = validateCronAuthorizationHeader(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isScanCronEnabled()) {
    return NextResponse.json({
      skipped: true,
      scanned: 0,
      new_opportunities: 0,
      alerts_sent: 0,
    });
  }

  return NextResponse.json({
    scanned: 0,
    new_opportunities: 0,
    alerts_sent: 0,
  });
}
