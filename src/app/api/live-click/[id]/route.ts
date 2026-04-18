import { NextResponse, type NextRequest } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = createServiceRoleClient();

  const { data: alert, error } = await supabase
    .from("live_alerts")
    .select("id, live_url, clicked_at")
    .eq("id", id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!alert.clicked_at) {
    await supabase
      .from("live_alerts")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", id)
      .is("clicked_at", null);
  }

  return NextResponse.redirect(alert.live_url, 302);
}
