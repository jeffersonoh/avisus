import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { enforcePlanLimit } from "@/lib/plan-enforce";
import { PLAN_LIMITS } from "@/lib/plan-limits";

import { createTestUser, deleteTestUser, signInAsUser, uniqueEmail } from "./setup";

const FREE_MAX_INTERESTS = PLAN_LIMITS.free.maxInterests;

describe("interests CRUD and plan limits", () => {
  const password = "AvisusTest2026!";
  let userId: string;
  let userClient: Awaited<ReturnType<typeof signInAsUser>>["client"];

  beforeEach(async () => {
    const email = uniqueEmail("interests");
    const user = await createTestUser(email, password);
    userId = user.id;
    const { client } = await signInAsUser(email, password);
    userClient = client;
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it("creates and reads back an interest", async () => {
    const { data, error } = await userClient
      .from("interests")
      .insert({ user_id: userId, term: "furadeira bosch", active: true })
      .select("id, term, active")
      .single();

    expect(error).toBeNull();
    expect(data?.term).toBe("furadeira bosch");
    expect(data?.active).toBe(true);
  });

  it("updates an interest term", async () => {
    const { data: created } = await userClient
      .from("interests")
      .insert({ user_id: userId, term: "furadeira", active: true })
      .select("id")
      .single();

    const { data: updated, error } = await userClient
      .from("interests")
      .update({ term: "furadeira makita" })
      .eq("id", created!.id)
      .select("term")
      .single();

    expect(error).toBeNull();
    expect(updated?.term).toBe("furadeira makita");
  });

  it("deletes an interest", async () => {
    const { data: created } = await userClient
      .from("interests")
      .insert({ user_id: userId, term: "parafusadeira", active: true })
      .select("id")
      .single();

    await userClient.from("interests").delete().eq("id", created!.id);

    const { data: found } = await userClient
      .from("interests")
      .select("id")
      .eq("id", created!.id)
      .maybeSingle();

    expect(found).toBeNull();
  });

  it(`blocks the ${FREE_MAX_INTERESTS + 1}th interest for FREE plan via limit enforcement`, async () => {
    for (let i = 0; i < FREE_MAX_INTERESTS; i++) {
      await userClient
        .from("interests")
        .insert({ user_id: userId, term: `termo-${i}`, active: true });
    }

    const { count } = await userClient
      .from("interests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("active", true);

    expect(count).toBe(FREE_MAX_INTERESTS);

    const limitError = enforcePlanLimit({
      plan: "free",
      currentCount: count ?? 0,
      limitKey: "maxInterests",
    });

    expect(limitError).not.toBeNull();
    expect(limitError?.code).toBe("LIMIT_REACHED");
  });

  it("interest is only visible to its owner", async () => {
    await userClient
      .from("interests")
      .insert({ user_id: userId, term: "privado", active: true });

    const otherEmail = uniqueEmail("interests-other");
    const otherUser = await createTestUser(otherEmail, password);
    const { client: otherClient } = await signInAsUser(otherEmail, password);

    try {
      const { data } = await otherClient
        .from("interests")
        .select("id")
        .eq("user_id", userId);

      expect(data).toHaveLength(0);
    } finally {
      await deleteTestUser(otherUser.id);
    }
  });
});
