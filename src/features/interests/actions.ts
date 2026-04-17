"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { appActionError, type AppActionError } from "@/lib/errors";
import { enforcePlanLimit } from "@/lib/plan-enforce";
import { normalizePlan } from "@/lib/plan-limits";
import { createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type InterestRow = Database["public"]["Tables"]["interests"]["Row"];

export type InterestActionItem = Pick<
  InterestRow,
  "id" | "term" | "active" | "created_at" | "last_scanned_at"
>;

export type CreateInterestResult =
  | { ok: true; interest: InterestActionItem }
  | { ok: false; error: AppActionError };

export type UpdateInterestResult =
  | { ok: true; interest: InterestActionItem }
  | { ok: false; error: AppActionError };

export type DeleteInterestResult =
  | { ok: true; id: string }
  | { ok: false; error: AppActionError };

const CreateInterestSchema = z.object({
  term: z
    .string()
    .trim()
    .min(2, "O termo deve ter pelo menos 2 caracteres.")
    .max(60, "O termo deve ter no maximo 60 caracteres."),
});

const UpdateInterestSchema = CreateInterestSchema.extend({
  id: z.string().uuid("Interesse invalido para edicao."),
});

const DeleteInterestSchema = z.object({
  id: z.string().uuid("Interesse invalido para remocao."),
});

function normalizeTerm(term: string): string {
  return term.trim().toLocaleLowerCase("pt-BR");
}

function mapUnknownError(): AppActionError {
  return appActionError("UNKNOWN", "Nao foi possivel salvar agora. Tente novamente em instantes.");
}

function mapDuplicateError(): AppActionError {
  return appActionError("DUPLICATE", "Esse termo ja esta na sua lista de interesses.");
}

async function resolveAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: appActionError("UNAUTHORIZED", "Sessao invalida. Faca login novamente."),
    };
  }

  return { supabase, user, error: null };
}

async function enforcePlanInterestLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AppActionError | null> {

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return mapUnknownError();
  }

  const { count, error: countError } = await supabase
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  if (countError) {
    return mapUnknownError();
  }

  return enforcePlanLimit({
    plan: normalizePlan(profile.plan),
    currentCount: count ?? 0,
    limitKey: "maxInterests",
    message: "Voce atingiu o limite de interesses do seu plano.",
  });
}

export async function createInterest(rawTerm: string): Promise<CreateInterestResult> {
  const parsed = CreateInterestSchema.safeParse({ term: rawTerm });
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Informe um termo valido.",
      ),
    };
  }

  const normalizedTerm = normalizeTerm(parsed.data.term);
  const { supabase, user, error: authError } = await resolveAuthenticatedUser();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const limitError = await enforcePlanInterestLimit(supabase, user.id);
  if (limitError) {
    return { ok: false, error: limitError };
  }

  const { data, error } = await supabase
    .from("interests")
    .insert({ user_id: user.id, term: normalizedTerm, active: true })
    .select("id, term, active, created_at, last_scanned_at")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: mapDuplicateError() };
    }
    return { ok: false, error: mapUnknownError() };
  }

  revalidatePath("/interesses");
  return { ok: true, interest: data };
}

export async function updateInterest(input: { id: string; term: string }): Promise<UpdateInterestResult> {
  const parsed = UpdateInterestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Dados invalidos para edicao.",
      ),
    };
  }

  const { supabase, user, error: authError } = await resolveAuthenticatedUser();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { data, error } = await supabase
    .from("interests")
    .update({ term: normalizeTerm(parsed.data.term) })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id, term, active, created_at, last_scanned_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: mapDuplicateError() };
    }
    return { ok: false, error: mapUnknownError() };
  }

  if (!data) {
    return {
      ok: false,
      error: appActionError("NOT_FOUND", "Interesse nao encontrado para edicao."),
    };
  }

  revalidatePath("/interesses");
  return { ok: true, interest: data };
}

export async function deleteInterest(rawId: string): Promise<DeleteInterestResult> {
  const parsed = DeleteInterestSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    return {
      ok: false,
      error: appActionError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Interesse invalido para remocao.",
      ),
    };
  }

  const { supabase, user, error: authError } = await resolveAuthenticatedUser();
  if (authError || !user) {
    return { ok: false, error: authError ?? mapUnknownError() };
  }

  const { data, error } = await supabase
    .from("interests")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapUnknownError() };
  }

  if (!data) {
    return {
      ok: false,
      error: appActionError("NOT_FOUND", "Interesse nao encontrado para remocao."),
    };
  }

  revalidatePath("/interesses");
  return { ok: true, id: data.id };
}
