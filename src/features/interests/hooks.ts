"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { getPlanLimit, isUnlimited, type Plan } from "@/lib/plan-limits";
import type { AppActionError } from "@/lib/errors";
import type { Database } from "@/types/database";

import {
  createInterest as createInterestAction,
  deleteInterest as deleteInterestAction,
  updateInterest as updateInterestAction,
} from "./actions";

export const INTERESTS_QUERY_KEY = ["interests"] as const;

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
const UNKNOWN_ERROR_MESSAGE =
  "Não foi possível salvar agora. Tente novamente em instantes.";

type UseInterestsOptions = {
  plan: Plan;
  initialInterests: InterestItem[];
};

function mapError(error: AppActionError): InterestActionResult {
  if (error.code === "VALIDATION_ERROR") {
    return { ok: false, reason: "validation", message: error.message };
  }

  if (error.code === "DUPLICATE") {
    return { ok: false, reason: "duplicate", message: error.message };
  }

  if (error.code === "LIMIT_REACHED") {
    return { ok: false, reason: "limit", message: error.message };
  }

  return { ok: false, reason: "unknown", message: error.message || UNKNOWN_ERROR_MESSAGE };
}

export function useInterests({ plan, initialInterests }: UseInterestsOptions) {
  const queryClient = useQueryClient();
  const [interests, setInterests] = useState<InterestItem[]>(() =>
    sortByCreatedAtDesc(initialInterests.filter((item) => item.active)),
  );

  const maxInterests = getPlanLimit(plan, "maxInterests");
  const unlimitedPlan = isUnlimited(maxInterests);
  const limitReached = !unlimitedPlan && interests.length >= maxInterests;
  const remainingSlots = unlimitedPlan ? null : Math.max(0, maxInterests - interests.length);

  const createMutation = useMutation({
    mutationFn: (term: string) => createInterestAction(term),
    onSuccess: (result) => {
      if (!result.ok) return;
      const newItem: InterestItem = {
        id: result.interest.id,
        term: result.interest.term,
        active: result.interest.active,
        created_at: result.interest.created_at,
        last_scanned_at: result.interest.last_scanned_at,
      };
      setInterests((prev) => sortByCreatedAtDesc([...prev, newItem]));
      void queryClient.invalidateQueries({ queryKey: INTERESTS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, term }: { id: string; term: string }) =>
      updateInterestAction({ id, term }),
    onSuccess: (result) => {
      if (!result.ok) return;
      const updatedItem: InterestItem = {
        id: result.interest.id,
        term: result.interest.term,
        active: result.interest.active,
        created_at: result.interest.created_at,
        last_scanned_at: result.interest.last_scanned_at,
      };
      setInterests((prev) =>
        sortByCreatedAtDesc(prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))),
      );
      void queryClient.invalidateQueries({ queryKey: INTERESTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInterestAction(id),
    onSuccess: (result) => {
      if (!result.ok) return;
      setInterests((prev) => prev.filter((item) => item.id !== result.id));
      void queryClient.invalidateQueries({ queryKey: INTERESTS_QUERY_KEY });
    },
  });

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
    const result = await createMutation.mutateAsync(normalizedTerm);
    if (!result.ok) return mapError(result.error);
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

    const result = await updateMutation.mutateAsync({ id, term: normalizedTerm });
    if (!result.ok) return mapError(result.error);
    return { ok: true };
  }

  async function deleteInterest(id: string): Promise<InterestActionResult> {
    const result = await deleteMutation.mutateAsync(id);
    if (!result.ok) return mapError(result.error);
    return { ok: true };
  }

  return {
    interests,
    maxInterests,
    unlimitedPlan,
    limitReached,
    remainingSlots,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createInterest,
    updateInterest,
    deleteInterest,
  };
}
