import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DevPlanSwitcher } from "@/components/DevPlanSwitcher";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PlanProvider } from "@/lib/plan-context";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, name")
    .eq("id", user.id)
    .maybeSingle();

  const plan = normalizePlan(profile?.plan);
  const userLabel =
    profile?.name?.trim() ||
    (typeof user.email === "string" && user.email.length > 0 ? user.email : "Conta");
  const userEmail = user.email ?? "";

  return (
    <ThemeProvider>
      <QueryProvider>
        <PlanProvider plan={plan}>
          <div className="flex min-h-screen flex-col">
            <AppHeader plan={plan} userLabel={userLabel} userEmail={userEmail} />
            <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</div>
            <BottomNav />
            {process.env.NODE_ENV === "development" && <DevPlanSwitcher currentPlan={plan} />}
          </div>
        </PlanProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
