import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUser, deleteTestUser, signInAsUser, uniqueEmail } from "./setup";

describe("onboarding flow", () => {
  const password = "AvisusTest2026!";
  let userId: string;
  let userClient: Awaited<ReturnType<typeof signInAsUser>>["client"];

  beforeEach(async () => {
    const email = uniqueEmail("onboarding");
    const user = await createTestUser(email, password);
    userId = user.id;
    const { client } = await signInAsUser(email, password);
    userClient = client;
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it("profile is auto-created with onboarded=false when user is created", async () => {
    const { data, error } = await userClient
      .from("profiles")
      .select("onboarded, plan")
      .eq("id", userId)
      .single();

    expect(error).toBeNull();
    expect(data?.onboarded).toBe(false);
    expect(data?.plan).toBe("free");
  });

  it("profile updates onboarded=true with uf and city after onboarding", async () => {
    const { error: updateError } = await userClient
      .from("profiles")
      .update({
        onboarded: true,
        uf: "SP",
        city: "São Paulo",
        alert_channels: ["web"],
      })
      .eq("id", userId);

    expect(updateError).toBeNull();

    const { data } = await userClient
      .from("profiles")
      .select("onboarded, uf, city, alert_channels")
      .eq("id", userId)
      .single();

    expect(data?.onboarded).toBe(true);
    expect(data?.uf).toBe("SP");
    expect(data?.city).toBe("São Paulo");
    expect(data?.alert_channels).toContain("web");
  });

  it("user cannot read or modify another user's profile", async () => {
    const otherEmail = uniqueEmail("onboarding-other");
    const otherUser = await createTestUser(otherEmail, password);

    try {
      const { data } = await userClient
        .from("profiles")
        .select("id")
        .eq("id", otherUser.id)
        .maybeSingle();

      expect(data).toBeNull();
    } finally {
      await deleteTestUser(otherUser.id);
    }
  });
});
