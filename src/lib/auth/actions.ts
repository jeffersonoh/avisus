"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";

import { getAppOrigin } from "./app-origin";
import { getPostAuthRedirectPath } from "./post-auth-path";
import { LoginSchema, RegisterSchema } from "./schemas";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  info?: string;
};

function isSupabaseEnvError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Missing env var");
}

function mapZodFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Partial<Record<"email" | "password", string>> {
  const out: Partial<Record<"email" | "password", string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password") {
      out[key] = issue.message;
    }
  }
  return out;
}

export async function signInWithEmail(
  _prev: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: mapZodFieldErrors(parsed.error.issues) };
  }

  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    if (isSupabaseEnvError(err)) {
      return {
        error:
          "Configuração incompleta: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.",
      };
    }
    throw err;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "Não foi possível entrar. Verifique e-mail e senha ou tente de novo em instantes.",
    };
  }

  redirect(await getPostAuthRedirectPath(supabase));
}

export async function signUpWithEmail(
  _prev: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: mapZodFieldErrors(parsed.error.issues) };
  }

  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    if (isSupabaseEnvError(err)) {
      return {
        error:
          "Configuração incompleta: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.",
      };
    }
    throw err;
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "Não foi possível concluir o cadastro. Verifique os dados ou tente de novo em instantes.",
    };
  }

  if (data.session) {
    redirect(await getPostAuthRedirectPath(supabase));
  }

  return {
    info: "Se o e-mail estiver disponível, você receberá instruções para ativar a conta.",
  };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  void formData;
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    if (isSupabaseEnvError(err)) {
      redirect("/login?error=config");
    }
    throw err;
  }
  const origin = await getAppOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}
