import { NextResponse, type NextRequest } from "next/server";

import { validateCronAuthorizationHeader } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = validateCronAuthorizationHeader(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    skipped: true,
    checked: 0,
    new_lives: 0,
    alerts_sent: 0,
  });
}
