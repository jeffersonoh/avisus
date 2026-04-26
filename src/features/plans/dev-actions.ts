"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { normalizePlan, type Plan } from "@/lib/plan-limits";
import { profileCacheTag } from "@/lib/profile-cache";
import { createServerClient } from "@/lib/supabase/server";

export async function setDevPlan(plan: Plan): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NODE_ENV !== "development") {
    return { ok: false, error: "Disponível apenas em desenvolvimento." };
  }

  const validated = normalizePlan(plan);

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan: validated })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag(profileCacheTag(user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
