import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DevPlanSwitcher } from "@/components/DevPlanSwitcher";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AlertNotifier } from "@/features/notifications/AlertNotifier";
import { UnreadAlertsProvider } from "@/features/notifications/UnreadAlertsProvider";
import { PlanProvider } from "@/lib/plan-context";
import { normalizePlan } from "@/lib/plan-limits";
import { getCachedProfile } from "@/lib/profile-cache";
import {
  AUTH_USER_EMAIL_HEADER,
  AUTH_USER_ID_HEADER,
} from "@/lib/supabase/middleware";
import { createServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const userId = requestHeaders.get(AUTH_USER_ID_HEADER);
  const userEmailHeader = requestHeaders.get(AUTH_USER_EMAIL_HEADER) ?? "";

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const [sessionResult, profile] = await Promise.all([
    supabase.auth.getSession(),
    getCachedProfile(userId),
  ]);

  const accessToken = sessionResult.data.session?.access_token ?? null;

  const plan = normalizePlan(profile?.plan);
  const userLabel =
    profile?.name?.trim() || (userEmailHeader.length > 0 ? userEmailHeader : "Conta");
  const userEmail = userEmailHeader;

  return (
    <ThemeProvider>
      <QueryProvider>
        <PlanProvider plan={plan}>
          <UnreadAlertsProvider userId={userId} accessToken={accessToken}>
            <div className="flex min-h-screen flex-col">
              <AppHeader
                plan={plan}
                userLabel={userLabel}
                userEmail={userEmail}
                isAdmin={profile?.is_admin === true}
              />
              <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">
                <AlertNotifier userId={userId} accessToken={accessToken} />
                {children}
              </div>
              <BottomNav />
              {process.env.NODE_ENV === "development" && <DevPlanSwitcher currentPlan={plan} />}
            </div>
          </UnreadAlertsProvider>
        </PlanProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
