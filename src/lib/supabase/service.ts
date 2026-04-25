import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

export function createServiceRoleClient() {
  const { supabaseUrl } = getSupabaseEnv();
  const isPreview = process.env.VERCEL_ENV === "preview";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    (isPreview ? process.env.hml_SUPABASE_SERVICE_ROLE_KEY : undefined) ??
    (isPreview ? process.env.hml_SUPABASE_SECRET_KEY : undefined);

  if (!serviceRoleKey) {
    throw new Error(
      "Missing env var: SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY (or hml preview equivalents)",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
