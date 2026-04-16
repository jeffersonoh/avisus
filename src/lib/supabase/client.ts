"use client";

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

let browserClient: SupabaseClient<Database> | undefined;

export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  browserClient = createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return browserClient;
}
