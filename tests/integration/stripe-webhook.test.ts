import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createServiceClient, createTestUser, deleteTestUser, signInAsUser, uniqueEmail } from "./setup";

describe("Stripe webhook mock — sync_profile_plan trigger", () => {
  const password = "AvisusTest2026!";
  let userId: string;
  let userClient: Awaited<ReturnType<typeof signInAsUser>>["client"];

  beforeEach(async () => {
    const email = uniqueEmail("stripe");
    const user = await createTestUser(email, password);
    userId = user.id;
    const { client } = await signInAsUser(email, password);
    userClient = client;
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it("profile starts with plan=free", async () => {
    const { data } = await userClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    expect(data?.plan).toBe("free");
  });

  it("sync_profile_plan trigger upgrades profile plan when subscription is inserted", async () => {
    const admin = createServiceClient();

    const { error: insertError } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
        stripe_subscription_id: `sub_test_${userId.slice(0, 8)}`,
        plan: "starter",
        status: "active",
      });

    expect(insertError).toBeNull();

    const { data: profile } = await userClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    expect(profile?.plan).toBe("starter");
  });

  it("sync_profile_plan trigger updates plan when subscription plan is updated", async () => {
    const admin = createServiceClient();

    const { data: sub } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: `cus_test2_${userId.slice(0, 8)}`,
        stripe_subscription_id: `sub_test2_${userId.slice(0, 8)}`,
        plan: "starter",
        status: "active",
      })
      .select("id")
      .single();

    await admin
      .from("subscriptions")
      .update({ plan: "pro" })
      .eq("id", sub!.id);

    const { data: profile } = await userClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    expect(profile?.plan).toBe("pro");
  });
});
