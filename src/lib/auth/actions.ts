"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearReferralCookie,
  readReferralCookie,
} from "@/features/referrals/cookies";
import { REFERRAL_SIGNUP_USED_MESSAGE } from "@/features/referrals/messages";
import { recordSignupReferral, validateReferralCode } from "@/features/referrals/server";
import { createServerClient } from "@/lib/supabase/server";

import { getAppOrigin } from "./app-origin";
import { mapZodFieldErrors } from "./map-zod-field-errors";
import { getPostAuthRedirectPath } from "./post-auth-path";
import {
  LoginSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
  UpdatePasswordSchema,
} from "./schemas";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword" | "referralCode", string>>;
  info?: string;
};

function isSupabaseEnvError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Missing env var");
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
    referralCode: String(formData.get("referralCode") ?? ""),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: mapZodFieldErrors(parsed.error.issues) };
  }

  const cookieStore = await cookies();
  const manualReferralCode = parsed.data.referralCode || null;
  let referralCode: string | null = manualReferralCode;
  if (!referralCode) {
    referralCode = readReferralCookie(cookieStore);
  }

  // Valida cupom no servidor antes de registrar associação.
  if (referralCode) {
    const validation = await validateReferralCode(referralCode);
    if (!validation.ok) {
      if (!manualReferralCode) {
        clearReferralCookie(cookieStore);
        referralCode = null;
      } else {
        return {
          fieldErrors: { referralCode: "Cupom inválido, inativo ou expirado." },
        };
      }
    }
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
    options: {
      emailRedirectTo: `${await getAppOrigin()}/auth/callback?next=/cadastro-confirmado`,
    },
  });

  if (error) {
    return {
      error: "Não foi possível concluir o cadastro. Verifique os dados ou tente de novo em instantes.",
    };
  }

  const userId = data.user?.id;

  // Registra referral após signup bem-sucedido usando o userId retornado pelo Supabase.
  let referralRecorded = false;
  if (userId && referralCode) {
    const referralResult = await recordSignupReferral({ userId, code: referralCode, source: "coupon" });
    referralRecorded = referralResult.ok;
  }

  // Limpa cookie de referral após consumo bem-sucedido ou cadastro explicitamente sem código.
  clearReferralCookie(cookieStore);

  if (data.session) {
    redirect(await getPostAuthRedirectPath(supabase));
  }

  return {
    info: referralRecorded
      ? `${REFERRAL_SIGNUP_USED_MESSAGE} Se o e-mail estiver disponível, você receberá instruções para ativar a conta.`
      : "Se o e-mail estiver disponível, você receberá instruções para ativar a conta.",
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

export async function requestPasswordReset(
  _prev: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
  };

  const parsed = PasswordResetRequestSchema.safeParse(raw);
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

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getAppOrigin()}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return {
      error: "Não foi possível enviar o link de redefinição. Tente de novo em instantes.",
    };
  }

  return {
    info: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.",
  };
}

export async function updatePassword(
  _prev: AuthFormState | null,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = UpdatePasswordSchema.safeParse(raw);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "O link de redefinição expirou. Solicite um novo link para continuar.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error: "Não foi possível redefinir sua senha. Solicite um novo link e tente novamente.",
    };
  }

  redirect("/login?reset=success");
}
