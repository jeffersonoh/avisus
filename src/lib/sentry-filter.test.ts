import type { Event } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { beforeSend } from "./sentry-filter";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return { event_id: "abc123", ...overrides };
}

describe("beforeSend — PII filter", () => {
  it("strips email from breadcrumb message", () => {
    const event = makeEvent({
      breadcrumbs: {
        values: [{ message: "User user@example.com logged in", timestamp: 0 }],
      },
    });
    const result = beforeSend(event)!;
    expect(result.breadcrumbs!.values![0].message).not.toContain("user@example.com");
    expect(result.breadcrumbs!.values![0].message).toContain("[REDACTED]");
  });

  it("strips email from breadcrumb data", () => {
    const event = makeEvent({
      breadcrumbs: {
        values: [{ data: { email: "secret@test.com", action: "click" }, timestamp: 0 }],
      },
    });
    const result = beforeSend(event)!;
    expect(result.breadcrumbs!.values![0].data!["email"]).toBe("[REDACTED]");
    expect(result.breadcrumbs!.values![0].data!["action"]).toBe("click");
  });

  it("strips request body and cookies", () => {
    const event = makeEvent({
      request: { data: '{"password":"s3cr3t"}', cookies: "session=abc", url: "/api/login" },
    });
    const result = beforeSend(event)!;
    expect(result.request!.data).toBeUndefined();
    expect(result.request!.cookies).toBeUndefined();
    expect(result.request!.url).toBe("/api/login");
  });

  it("redacts authorization header", () => {
    const event = makeEvent({
      request: {
        headers: { authorization: "Bearer tok_secret123", "content-type": "application/json" },
        url: "/api/cron/scan",
      },
    });
    const result = beforeSend(event)!;
    expect(result.request!.headers!["authorization"]).toBe("[REDACTED]");
    expect(result.request!.headers!["content-type"]).toBe("application/json");
  });

  it("keeps only user.id, drops other user fields", () => {
    const event = makeEvent({
      user: { id: "usr_123", email: "me@example.com", username: "me" },
    });
    const result = beforeSend(event)!;
    expect(result.user).toEqual({ id: "usr_123" });
  });

  it("passes through events with no PII unchanged (structure)", () => {
    const event = makeEvent({ message: "Server started" });
    const result = beforeSend(event);
    expect(result).not.toBeNull();
    expect(result!.message).toBe("Server started");
  });

  it("strips phone number patterns from breadcrumb message", () => {
    const event = makeEvent({
      breadcrumbs: { values: [{ message: "Contact: 11 99999-8888", timestamp: 0 }] },
    });
    const result = beforeSend(event)!;
    expect(result.breadcrumbs!.values![0].message).not.toMatch(/\d{2}[\s.-]?\d{4,5}/);
  });
});
