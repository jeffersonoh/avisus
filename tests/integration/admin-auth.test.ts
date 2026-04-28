import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { isAdmin } from "@/lib/auth/admin";

import {
  ANON_KEY,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  uniqueEmail,
} from "./setup";

describe("admin authorization integration", () => {
  const password = "AvisusTest2026!";
  const userIds: string[] = [];

  let admin: ReturnType<typeof createServiceClient>;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  });

  beforeEach(() => {
    admin = createServiceClient();
  });

  afterEach(async () => {
    await Promise.all(userIds.splice(0).map((userId) => deleteTestUser(userId)));
  });

  async function createUserWithAdminFlag(isAdminFlag: boolean): Promise<string> {
    const user = await createTestUser(uniqueEmail("admin-auth"), password);
    userIds.push(user.id);

    const { error } = await admin
      .from("profiles")
      .update({ is_admin: isAdminFlag })
      .eq("id", user.id);

    expect(error).toBeNull();
    return user.id;
  }

  it("authorizes users whose profile has is_admin=true", async () => {
    const userId = await createUserWithAdminFlag(true);

    await expect(isAdmin(userId)).resolves.toBe(true);
  });

  it("does not authorize common authenticated users", async () => {
    const userId = await createUserWithAdminFlag(false);

    await expect(isAdmin(userId)).resolves.toBe(false);
  });
});
