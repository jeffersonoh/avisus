export interface SupabaseEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const isPreview = process.env.VERCEL_ENV === "preview";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_hml_SUPABASE_URL ??
    (isPreview ? process.env.hml_SUPABASE_URL : undefined);

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_hml_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_hml_SUPABASE_PUBLISHABLE_KEY ??
    (isPreview ? process.env.hml_SUPABASE_ANON_KEY : undefined);

  if (!supabaseUrl) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_hml_SUPABASE_URL",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or hml preview equivalents)",
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
