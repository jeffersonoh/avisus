import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/profile/ProfileForm";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";
import {
  AUTH_USER_EMAIL_HEADER,
  AUTH_USER_ID_HEADER,
} from "@/lib/supabase/middleware";

export default async function PerfilPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get(AUTH_USER_ID_HEADER);
  const userEmail = requestHeaders.get(AUTH_USER_EMAIL_HEADER) ?? "";

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, uf, city, telegram_username, alert_channels, plan")
    .eq("id", userId)
    .maybeSingle();

  return (
    <ProfileForm
      plan={normalizePlan(profile?.plan)}
      initialName={profile?.name ?? ""}
      initialEmail={userEmail}
      initialPhone={profile?.phone ?? null}
      initialUf={profile?.uf ?? null}
      initialCity={profile?.city ?? null}
      initialTelegramUsername={profile?.telegram_username ?? null}
      initialAlertChannels={profile?.alert_channels ?? ["web"]}
    />
  );
}
