import { NextResponse, type NextRequest } from "next/server";

import { listReferralCommissionExportRows } from "@/features/referrals/actions";
import { serializeReferralCommissionsCsv } from "@/features/referrals/csv";

export const runtime = "nodejs";

function buildCsvFilename(): string {
  return `comissoes-referral-${new Date().toISOString().slice(0, 10)}.csv`;
}

export async function GET(request: NextRequest) {
  const paidOnly = request.nextUrl.searchParams.get("status") !== "all";

  let result: Awaited<ReturnType<typeof listReferralCommissionExportRows>>;
  try {
    result = await listReferralCommissionExportRows({ paidOnly });
  } catch {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(serializeReferralCommissionsCsv(result.rows), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${buildCsvFilename()}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
