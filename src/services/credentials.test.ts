import { describe, expect, it } from "vitest";
import { assertCallable, calculateExpiry, credentialExpirySchema, credentialStatus, redactSensitive, requestPreview, type AuthConfig } from "./credentials";

describe("credential expiry", () => {
  it("calculates 2592000 seconds as exactly 30 days", () => expect(calculateExpiry("2026-08-01T12:00:00.000Z", 2592000)).toBe("2026-08-31T12:00:00.000Z"));
  it("requires issuedAt and positive seconds in duration mode", () => expect(credentialExpirySchema.safeParse({ mode: "duration", expiresInSeconds: 2592000 }).success).toBe(false));
  it("does not support Unix timestamp inference", () => expect(credentialExpirySchema.safeParse({ mode: "timestamp", expiresAt: 2592000 }).success).toBe(false));
  it("blocks expired credentials", () => expect(() => assertCallable({ mode: "datetime", expiresAt: "2020-01-01T00:00:00.000Z", source: "manual" })).toThrow(/过期/));
  it("lets provider invalidation override a future expiresAt", () => expect(credentialStatus({ mode: "datetime", expiresAt: "2099-01-01T00:00:00.000Z" }, new Date("2026-08-01T00:00:00Z"), "revoked")).toBe("revoked"));
});

describe("credential injection and redaction", () => {
  it("previews Query access_token without exposing its value", () => {
    const config: AuthConfig = { type: "api_key", injectionMode: "standard", location: "query", parameterName: "access_token", credentialKey: "credential.baidu.primary" };
    expect(requestPreview(config)).toBe("GET /sse?access_token=••••••••");
    expect(JSON.stringify(config)).not.toContain("DEMO_SECRET");
  });
  it("previews a Bearer header with a mask", () => expect(requestPreview({ type: "bearer", credentialKey: "credential.demo" })).toContain("Authorization: Bearer ••••••••"));
  it("redacts tokens in URLs, logs and errors", () => {
    const raw = "GET /sse?access_token=DEMO_SECRET Authorization=Bearer abc.def";
    const safe = redactSensitive(raw);
    expect(safe).not.toContain("DEMO_SECRET");
    expect(safe).not.toContain("abc.def");
  });
  it("keeps Evernote token opaque and referenced", () => {
    const config: AuthConfig = { type: "api_key", injectionMode: "protocol", parameterName: "authToken", credentialKey: "credential.evernote.primary", executor: "EdamExecutor", expiry: { mode: "unknown" } };
    expect(requestPreview(config)).toContain("EdamExecutor");
    expect(JSON.stringify(config)).not.toMatch(/S=.*:U=/);
  });
});
