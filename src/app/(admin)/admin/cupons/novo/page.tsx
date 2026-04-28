import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { createReferralCouponAction } from "@/features/referrals/actions";
import { ReferralCouponForm } from "@/features/referrals/admin/ReferralCouponForm";
import type { ReferralCouponAdminInput } from "@/features/referrals/schemas";
import { requireAdmin } from "@/lib/auth/admin";

async function createCoupon(input: ReferralCouponAdminInput) {
  "use server";

  return createReferralCouponAction(input);
}

export default async function NewReferralCouponPage() {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/cupons"
        className="inline-flex items-center gap-2 text-sm font-bold"
        style={{ color: "var(--text-3)", textDecoration: "none" }}
      >
        <AppIcon name="arrow-left" size={14} stroke="currentColor" />
        Voltar para cupons
      </Link>
      <ReferralCouponForm mode="create" submitAction={createCoupon} />
    </div>
  );
}
