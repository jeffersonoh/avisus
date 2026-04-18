import { NextResponse, type NextRequest } from "next/server";

import { validateCronAuthorizationHeader } from "@/lib/cron/auth";
import { runCleanupJob } from "@/lib/scanner/cleanup";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = validateCronAuthorizationHeader(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await runCleanupJob(supabase);

    console.info(
      `[cron][cleanup] expired=${result.expired} deleted_price_history=${result.deletedPriceHistory} deleted_opportunities=${result.deletedOpportunities} reset_live=${result.resetLive}`,
    );

    return NextResponse.json({
      skipped: false,
      expired: result.expired,
      deleted_price_history: result.deletedPriceHistory,
      deleted_opportunities: result.deletedOpportunities,
      reset_live: result.resetLive,
    });
  } catch (error) {
    console.error("[cron][cleanup] failed to run cleanup job", error);
    return NextResponse.json(
      {
        error: "Cleanup pipeline failed",
        expired: 0,
        deleted_price_history: 0,
        deleted_opportunities: 0,
        reset_live: 0,
      },
      { status: 500 },
    );
  }
}
