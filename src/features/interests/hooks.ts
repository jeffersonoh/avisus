"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

import { getPlanLimit, isUnlimited, type Plan } from "@/lib/plan-limits";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type InterestRow = Database["public"]["Tables"]["interests"]["Row"];

export type InterestItem = Pick<
  InterestRow,
  "id" | "term" | "active" | "created_at" | "last_scanned_at"
>;

export const InterestSchema = z.object({
  term: z
    .string()
    .trim()
    .min(2, "O termo deve ter pelo menos 2 caracteres.")
    .max(60, "O termo deve ter no máximo 60 caracteres."),
});

export type InterestInput = z.infer<typeof InterestSchema>;

export type InterestActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "validation" | "duplicate" | "limit" | "unknown";
      message: string;
    };

export const POPULAR_INTEREST_SUGGESTIONS = [
  "parafusadeira",
  "air fryer",
  "playstation 5",
  "notebook gamer",
  "tênis nike",
  "iphone",
] as const;

function sortByCreatedAtDesc(items: InterestItem[]): InterestItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return a.term.localeCompare(b.term, "pt-BR");
    }

    return bTime - aTime;
  });
}

function normalizeForCompare(term: string): string {
  return term.trim().toLocaleLowerCase("pt-BR");
}

export function normalizeInterestTerm(term: string): string {
  return normalizeForCompare(term);
}

function hasDuplicateTerm(
  items: InterestItem[],
  term: string,
  options?: { ignoreId?: string },
): boolean {
  const normalizedCandidate = normalizeForCompare(term);
  return items.some((item) => {
    if (options?.ignoreId && item.id === options.ignoreId) {
      return false;
    }
    return normalizeForCompare(item.term) === normalizedCandidate;
  });
}

const DUPLICATE_ERROR_MESSAGE = "Esse termo já está na sua lista de interesses.";
const LIMIT_ERROR_MESSAGE = "Você atingiu o limite de interesses do seu plano.";
const UNKNOWN_ERROR_MESSAGE =
  "Não foi possível salvar agora. Tente novamente em instantes.";

type UseInterestsOptions = {
  userId: string;
  plan: Plan;
  initialInterests: InterestItem[];
};

export function useInterests({ userId, plan, initialInterests }: UseInterestsOptions) {
  const [interests, setInterests] = useState<InterestItem[]>(() =>
    sortByCreatedAtDesc(initialInterests.filter((item) => item.active)),
  );

  const supabase = useMemo(() => createBrowserClient(), []);
  const maxInterests = getPlanLimit(plan, "maxInterests");
  const unlimitedPlan = isUnlimited(maxInterests);
  const limitReached = !unlimitedPlan && interests.length >= maxInterests;
  const remainingSlots = unlimitedPlan ? null : Math.max(0, maxInterests - interests.length);

  async function createInterest(rawTerm: string): Promise<InterestActionResult> {
    const parsed = InterestSchema.safeParse({ term: rawTerm });
    if (!parsed.success) {
      return {
        ok: false,
        reason: "validation",
        message: parsed.error.issues[0]?.message ?? "Informe um termo válido.",
      };
    }

    const normalizedTerm = normalizeInterestTerm(parsed.data.term);

    if (hasDuplicateTerm(interests, normalizedTerm)) {
      return { ok: false, reason: "duplicate", message: DUPLICATE_ERROR_MESSAGE };
    }

    if (!unlimitedPlan && interests.length >= maxInterests) {
      return { ok: false, reason: "limit", message: LIMIT_ERROR_MESSAGE };
    }

    const { data, error } = await supabase
      .from("interests")
      .insert({ user_id: userId, term: normalizedTerm, active: true })
      .select("id, term, active, created_at, last_scanned_at")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { ok: false, reason: "duplicate", message: DUPLICATE_ERROR_MESSAGE };
      }
      return { ok: false, reason: "unknown", message: UNKNOWN_ERROR_MESSAGE };
    }

    const newItem: InterestItem = {
      id: data.id,
      term: data.term,
      active: data.active,
      created_at: data.created_at,
      last_scanned_at: data.last_scanned_at,
    };

    setInterests((prev) => sortByCreatedAtDesc([...prev, newItem]));
    return { ok: true };
  }

  async function updateInterest(id: string, rawTerm: string): Promise<InterestActionResult> {
    const parsed = InterestSchema.safeParse({ term: rawTerm });
    if (!parsed.success) {
      return {
        ok: false,
        reason: "validation",
        message: parsed.error.issues[0]?.message ?? "Informe um termo válido.",
      };
    }

    const normalizedTerm = normalizeInterestTerm(parsed.data.term);

    if (hasDuplicateTerm(interests, normalizedTerm, { ignoreId: id })) {
      return { ok: false, reason: "duplicate", message: DUPLICATE_ERROR_MESSAGE };
    }

    const { data, error } = await supabase
      .from("interests")
      .update({ term: normalizedTerm })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, term, active, created_at, last_scanned_at")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { ok: false, reason: "duplicate", message: DUPLICATE_ERROR_MESSAGE };
      }
      return { ok: false, reason: "unknown", message: UNKNOWN_ERROR_MESSAGE };
    }

    const updatedItem: InterestItem = {
      id: data.id,
      term: data.term,
      active: data.active,
      created_at: data.created_at,
      last_scanned_at: data.last_scanned_at,
    };

    setInterests((prev) =>
      sortByCreatedAtDesc(prev.map((item) => (item.id === id ? updatedItem : item))),
    );

    return { ok: true };
  }

  async function deleteInterest(id: string): Promise<InterestActionResult> {
    const { error } = await supabase
      .from("interests")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, reason: "unknown", message: UNKNOWN_ERROR_MESSAGE };
    }

    setInterests((prev) => prev.filter((item) => item.id !== id));
    return { ok: true };
  }

  return {
    interests,
    maxInterests,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    createInterest,
    updateInterest,
    deleteInterest,
  };
}
