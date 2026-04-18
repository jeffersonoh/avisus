import { NextResponse, type NextRequest } from "next/server";

import { validateCronAuthorizationHeader } from "@/lib/cron/auth";
import { runHotRefresh } from "@/lib/scanner/hot";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authResult = validateCronAuthorizationHeader(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await runHotRefresh(supabase);

    return NextResponse.json({
      skipped: false,
      refreshed: result.refreshed,
    });
  } catch (error) {
    console.error("[cron][hot] failed to refresh hot flags", error);
    return NextResponse.json(
      {
        error: "Hot refresh pipeline failed",
        refreshed: 0,
      },
      { status: 500 },
    );
  }
}
