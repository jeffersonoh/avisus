import { describe, expect, it } from "vitest";

import { LoginSchema, RegisterSchema } from "./schemas";

describe("LoginSchema", () => {
  it("validates email and password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("accepts signup without referralCode", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referralCode).toBeUndefined();
    }
  });

  it("accepts signup with empty referralCode", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      referralCode: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referralCode).toBe("");
    }
  });

  it("normalizes valid referralCode to uppercase", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      referralCode: "test_2026",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referralCode).toBe("TEST_2026");
    }
  });

  it("rejects referralCode with invalid format", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      referralCode: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const referralCodeIssue = result.error.issues.find((i) => i.path[0] === "referralCode");
      expect(referralCodeIssue).toBeDefined();
      expect(referralCodeIssue?.message).toBe("Cupom inválido.");
    }
  });

  it("rejects referralCode with invalid characters", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      referralCode: "TEST-2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const referralCodeIssue = result.error.issues.find((i) => i.path[0] === "referralCode");
      expect(referralCodeIssue).toBeDefined();
    }
  });

  it("rejects missing email even with valid referralCode", () => {
    const result = RegisterSchema.safeParse({
      email: "",
      password: "password123",
      referralCode: "TEST_2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailIssue).toBeDefined();
    }
  });

  it("rejects short password even with valid referralCode", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "short",
      referralCode: "TEST_2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === "password");
      expect(passwordIssue).toBeDefined();
    }
  });
});
