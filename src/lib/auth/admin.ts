import "server-only";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  return data?.is_admin === true;
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const allowed = await isAdmin(user.id);
  if (!allowed) {
    redirect("/dashboard?error=403");
  }

  return { userId: user.id };
}
