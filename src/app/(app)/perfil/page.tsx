import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/profile/ProfileForm";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, uf, city, telegram_username, alert_channels, plan")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ProfileForm
      plan={normalizePlan(profile?.plan)}
      initialName={profile?.name ?? ""}
      initialEmail={user.email ?? ""}
      initialPhone={profile?.phone ?? null}
      initialUf={profile?.uf ?? null}
      initialCity={profile?.city ?? null}
      initialTelegramUsername={profile?.telegram_username ?? null}
      initialAlertChannels={profile?.alert_channels ?? ["web"]}
    />
  );
}
