import { NextResponse, type NextRequest } from "next/server";

import { validateCronAuthorizationHeader } from "@/lib/cron/auth";
import { runLiveMonitor } from "@/lib/scanner/live/live-monitor";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = validateCronAuthorizationHeader(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLiveMonitor();
    return NextResponse.json({
      skipped: false,
      checked: result.checked,
      new_lives: result.new_lives,
      alerts_sent: result.alerts_sent,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Live monitor pipeline failed",
        checked: 0,
        new_lives: 0,
        alerts_sent: 0,
      },
      { status: 500 },
    );
  }
}
