import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const supabaseClient = {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
  };

  return {
    cookieStore,
    createServerClient: vi.fn(),
    getAppOrigin: vi.fn(),
    getPostAuthRedirectPath: vi.fn(),
    recordSignupReferral: vi.fn(),
    supabaseClient,
    validateReferralCode: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mocks.cookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT: ${path}`), {
      digest: `NEXT_REDIRECT;replace;${path};307;`,
    });
  },
}));

vi.mock("@/features/referrals/server", () => ({
  recordSignupReferral: mocks.recordSignupReferral,
  validateReferralCode: mocks.validateReferralCode,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("./app-origin", () => ({
  getAppOrigin: mocks.getAppOrigin,
}));

vi.mock("./post-auth-path", () => ({
  getPostAuthRedirectPath: mocks.getPostAuthRedirectPath,
}));

import {
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  updatePassword,
} from "./actions";
import { REFERRAL_SIGNUP_USED_MESSAGE } from "@/features/referrals/messages";
import { mapZodFieldErrors } from "./map-zod-field-errors";

function formData(input: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(input)) {
    data.set(key, value);
  }
  return data;
}

const configError =
  "Configuração incompleta: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.";

describe("mapZodFieldErrors", () => {
  it("maps supported fields and ignores unknown keys", () => {
    const result = mapZodFieldErrors([
      { path: ["email"], message: "Informe um e-mail válido." },
      { path: ["password"], message: "A senha deve ter pelo menos 8 caracteres." },
      { path: ["confirmPassword"], message: "As senhas informadas não conferem." },
      { path: ["referralCode"], message: "Cupom inválido." },
      { path: ["unknown"], message: "Ignorado." },
    ]);

    expect(result).toStrictEqual({
      email: "Informe um e-mail válido.",
      password: "A senha deve ter pelo menos 8 caracteres.",
      confirmPassword: "As senhas informadas não conferem.",
      referralCode: "Cupom inválido.",
    });
  });

  it("returns an empty object when there are no issues", () => {
    expect(mapZodFieldErrors([])).toStrictEqual({});
  });
});

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.createServerClient.mockResolvedValue(mocks.supabaseClient);
    mocks.getAppOrigin.mockResolvedValue("http://localhost:3000");
    mocks.getPostAuthRedirectPath.mockResolvedValue("/dashboard");
    mocks.recordSignupReferral.mockResolvedValue({ ok: true });
  });

  describe("signInWithEmail", () => {
    it("returns field errors for invalid input", async () => {
      const result = await signInWithEmail(null, formData({ email: "invalid", password: "short" }));

      expect(result.fieldErrors?.email).toBe("Informe um e-mail válido.");
      expect(result.fieldErrors?.password).toBe("A senha deve ter pelo menos 8 caracteres.");
      expect(mocks.createServerClient).not.toHaveBeenCalled();
    });

    it("returns configuration error when Supabase env is missing", async () => {
      mocks.createServerClient.mockRejectedValue(new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL"));

      const result = await signInWithEmail(
        null,
        formData({ email: "user@example.com", password: "password123" }),
      );

      expect(result).toStrictEqual({ error: configError });
    });

    it("returns generic error when credentials fail", async () => {
      mocks.supabaseClient.auth.signInWithPassword.mockResolvedValue({ error: { message: "bad login" } });

      const result = await signInWithEmail(
        null,
        formData({ email: "user@example.com", password: "password123" }),
      );

      expect(result).toStrictEqual({
        error: "Não foi possível entrar. Verifique e-mail e senha ou tente de novo em instantes.",
      });
    });

    it("redirects after successful sign in", async () => {
      mocks.supabaseClient.auth.signInWithPassword.mockResolvedValue({ error: null });

      await expect(
        signInWithEmail(null, formData({ email: "user@example.com", password: "password123" })),
      ).rejects.toThrow("NEXT_REDIRECT: /dashboard");
    });
  });

  describe("signUpWithEmail", () => {
    it("returns field errors before reading cookies for invalid schema input", async () => {
      const result = await signUpWithEmail(null, formData({ email: "", password: "short", referralCode: "abc" }));

      expect(result.fieldErrors?.email).toBe("Informe um e-mail válido.");
      expect(result.fieldErrors?.password).toBe("A senha deve ter pelo menos 8 caracteres.");
      expect(result.fieldErrors?.referralCode).toBe("Cupom inválido.");
      expect(mocks.cookieStore.get).not.toHaveBeenCalled();
    });

    it("prioritizes manual referralCode over cookie when both exist", async () => {
      mocks.cookieStore.get.mockReturnValue({ value: "COOKIE_2026" });
      mocks.validateReferralCode.mockResolvedValue({ ok: true, coupon: { id: "coupon-manual", code: "MANUAL_2026" } });
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: { id: "user-123" }, session: null }, error: null });

      const result = await signUpWithEmail(
        null,
        formData({ email: "test@example.com", password: "password123", referralCode: "MANUAL_2026" }),
      );

      expect(mocks.validateReferralCode).toHaveBeenCalledWith("MANUAL_2026");
      expect(mocks.validateReferralCode).not.toHaveBeenCalledWith("COOKIE_2026");
      expect(mocks.recordSignupReferral).toHaveBeenCalledWith({ userId: "user-123", code: "MANUAL_2026", source: "coupon" });
      expect(result).toStrictEqual({
        info: `${REFERRAL_SIGNUP_USED_MESSAGE} Se o e-mail estiver disponível, você receberá instruções para ativar a conta.`,
      });
    });

    it("uses cookie referralCode when manual field is empty", async () => {
      mocks.cookieStore.get.mockReturnValue({ value: "COOKIE_2026" });
      mocks.validateReferralCode.mockResolvedValue({ ok: true, coupon: { id: "cookie-coupon", code: "COOKIE_2026" } });
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: { id: "user-456" }, session: null }, error: null });

      const result = await signUpWithEmail(
        null,
        formData({ email: "test2@example.com", password: "password123", referralCode: "" }),
      );

      expect(mocks.validateReferralCode).toHaveBeenCalledWith("COOKIE_2026");
      expect(mocks.recordSignupReferral).toHaveBeenCalledWith({ userId: "user-456", code: "COOKIE_2026", source: "coupon" });
      expect(result).toStrictEqual({
        info: `${REFERRAL_SIGNUP_USED_MESSAGE} Se o e-mail estiver disponível, você receberá instruções para ativar a conta.`,
      });
    });

    it("returns removable field error for invalid manual referralCode", async () => {
      mocks.validateReferralCode.mockResolvedValue({ ok: false, reason: "not_found" });

      const result = await signUpWithEmail(
        null,
        formData({ email: "test@example.com", password: "password123", referralCode: "INVALID" }),
      );

      expect(result).toStrictEqual({ fieldErrors: { referralCode: "Cupom inválido, inativo ou expirado." } });
      expect(mocks.supabaseClient.auth.signUp).not.toHaveBeenCalled();
      expect(mocks.recordSignupReferral).not.toHaveBeenCalled();
    });

    it("clears invalid cookie referral and proceeds without attribution", async () => {
      mocks.cookieStore.get.mockReturnValue({ value: "COOKIE_2026" });
      mocks.validateReferralCode.mockResolvedValue({ ok: false, reason: "inactive" });
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: { id: "user-789" }, session: null }, error: null });

      const result = await signUpWithEmail(
        null,
        formData({ email: "test3@example.com", password: "password123", referralCode: "" }),
      );

      expect(mocks.validateReferralCode).toHaveBeenCalledWith("COOKIE_2026");
      expect(mocks.recordSignupReferral).not.toHaveBeenCalled();
      expect(mocks.cookieStore.set).toHaveBeenCalledWith(
        "avisus_referral_code",
        "",
        expect.objectContaining({ maxAge: 0, path: "/", sameSite: "lax", httpOnly: true }),
      );
      expect(result).toStrictEqual({ info: "Se o e-mail estiver disponível, você receberá instruções para ativar a conta." });
    });

    it("proceeds without referral when no code is provided", async () => {
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: { id: "user-no-ref" }, session: null }, error: null });

      const result = await signUpWithEmail(
        null,
        formData({ email: "noref@example.com", password: "password123" }),
      );

      expect(mocks.validateReferralCode).not.toHaveBeenCalled();
      expect(mocks.recordSignupReferral).not.toHaveBeenCalled();
      expect(mocks.cookieStore.set).toHaveBeenCalled();
      expect(result).toStrictEqual({ info: "Se o e-mail estiver disponível, você receberá instruções para ativar a conta." });
    });

    it("returns configuration error when signup client cannot be created", async () => {
      mocks.createServerClient.mockRejectedValue(new Error("Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY"));

      const result = await signUpWithEmail(
        null,
        formData({ email: "config@example.com", password: "password123" }),
      );

      expect(result).toStrictEqual({ error: configError });
    });

    it("returns generic error when Supabase signup fails", async () => {
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "User exists" } });

      const result = await signUpWithEmail(
        null,
        formData({ email: "existing@example.com", password: "password123" }),
      );

      expect(result).toStrictEqual({
        error: "Não foi possível concluir o cadastro. Verifique os dados ou tente de novo em instantes.",
      });
    });

    it("redirects after signup when session is immediately available", async () => {
      mocks.supabaseClient.auth.signUp.mockResolvedValue({ data: { user: { id: "user-session" }, session: { access_token: "token" } }, error: null });

      await expect(
        signUpWithEmail(null, formData({ email: "session@example.com", password: "password123" })),
      ).rejects.toThrow("NEXT_REDIRECT: /dashboard");
    });
  });

  describe("signInWithGoogle", () => {
    it("redirects to config error when Supabase env is missing", async () => {
      mocks.createServerClient.mockRejectedValue(new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL"));

      await expect(signInWithGoogle(new FormData())).rejects.toThrow("NEXT_REDIRECT: /login?error=config");
    });

    it("redirects to oauth error when provider URL is unavailable", async () => {
      mocks.supabaseClient.auth.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });

      await expect(signInWithGoogle(new FormData())).rejects.toThrow("NEXT_REDIRECT: /login?error=oauth");
    });

    it("redirects to provider URL on success", async () => {
      mocks.supabaseClient.auth.signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.test/oauth" }, error: null });

      await expect(signInWithGoogle(new FormData())).rejects.toThrow("NEXT_REDIRECT: https://accounts.google.test/oauth");
    });
  });

  describe("requestPasswordReset", () => {
    it("returns field errors for invalid email", async () => {
      const result = await requestPasswordReset(null, formData({ email: "invalid" }));

      expect(result.fieldErrors?.email).toBe("Informe um e-mail válido.");
    });

    it("returns configuration error when client cannot be created", async () => {
      mocks.createServerClient.mockRejectedValue(new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL"));

      const result = await requestPasswordReset(null, formData({ email: "user@example.com" }));

      expect(result).toStrictEqual({ error: configError });
    });

    it("returns generic error when reset email fails", async () => {
      mocks.supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({ error: { message: "SMTP unavailable" } });

      const result = await requestPasswordReset(null, formData({ email: "user@example.com" }));

      expect(result).toStrictEqual({ error: "Não foi possível enviar o link de redefinição. Tente de novo em instantes." });
    });

    it("returns info when reset email is accepted", async () => {
      mocks.supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await requestPasswordReset(null, formData({ email: "user@example.com" }));

      expect(mocks.supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
        redirectTo: "http://localhost:3000/auth/callback?next=/redefinir-senha",
      });
      expect(result).toStrictEqual({ info: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha." });
    });
  });

  describe("updatePassword", () => {
    it("returns field errors when passwords are invalid or do not match", async () => {
      const result = await updatePassword(
        null,
        formData({ password: "password123", confirmPassword: "different123" }),
      );

      expect(result.fieldErrors?.confirmPassword).toBe("As senhas informadas não conferem.");
    });

    it("returns configuration error when client cannot be created", async () => {
      mocks.createServerClient.mockRejectedValue(new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL"));

      const result = await updatePassword(
        null,
        formData({ password: "password123", confirmPassword: "password123" }),
      );

      expect(result).toStrictEqual({ error: configError });
    });

    it("returns expired-link error when no user is authenticated", async () => {
      mocks.supabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await updatePassword(
        null,
        formData({ password: "password123", confirmPassword: "password123" }),
      );

      expect(result).toStrictEqual({ error: "O link de redefinição expirou. Solicite um novo link para continuar." });
    });

    it("returns generic error when password update fails", async () => {
      mocks.supabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      mocks.supabaseClient.auth.updateUser.mockResolvedValue({ error: { message: "weak password" } });

      const result = await updatePassword(
        null,
        formData({ password: "password123", confirmPassword: "password123" }),
      );

      expect(result).toStrictEqual({ error: "Não foi possível redefinir sua senha. Solicite um novo link e tente novamente." });
    });

    it("redirects to login after successful password update", async () => {
      mocks.supabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      mocks.supabaseClient.auth.updateUser.mockResolvedValue({ error: null });

      await expect(
        updatePassword(null, formData({ password: "password123", confirmPassword: "password123" })),
      ).rejects.toThrow("NEXT_REDIRECT: /login?reset=success");
    });
  });
});
