import { z } from "zod";

export const credentialExpiryModeSchema = z.enum(["unknown", "datetime", "duration"]);
export type CredentialExpiryMode = z.infer<typeof credentialExpiryModeSchema>;

export const credentialExpirySchema = z.object({
  mode: credentialExpiryModeSchema,
  issuedAt: z.string().datetime().optional(),
  expiresInSeconds: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  source: z.enum(["manual", "provider_response", "calculated"]).optional(),
}).superRefine((value, context) => {
  if (value.mode === "datetime" && !value.expiresAt) context.addIssue({ code: "custom", path: ["expiresAt"], message: "请填写过期日期时间" });
  if (value.mode === "duration") {
    if (!value.issuedAt) context.addIssue({ code: "custom", path: ["issuedAt"], message: "请填写起算时间" });
    if (!value.expiresInSeconds) context.addIssue({ code: "custom", path: ["expiresInSeconds"], message: "请填写有效时长（秒）" });
    if (!value.expiresAt) context.addIssue({ code: "custom", path: ["expiresAt"], message: "缺少计算后的过期时间" });
  }
});
export type CredentialExpiry = z.infer<typeof credentialExpirySchema>;

export const authTypeSchema = z.enum(["none", "bearer", "api_key", "basic", "oauth2", "custom"]);
export type AuthType = z.infer<typeof authTypeSchema>;
export type InjectionMode = "standard" | "protocol";
export type CredentialLocation = "header" | "query" | "cookie";
export type CredentialValueType = "string" | "number" | "boolean" | "json";

export interface CredentialKeyValue {
  id: string;
  location: CredentialLocation;
  name: string;
  credentialKey: string;
  valueType: CredentialValueType;
  prefix?: string;
  secret: boolean;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  injectionMode?: InjectionMode;
  location?: CredentialLocation;
  parameterName?: string;
  prefix?: string;
  credentialKey?: string;
  executor?: string;
  expiry?: CredentialExpiry;
  custom?: CredentialKeyValue[];
}

export type CredentialStatus = "valid" | "expiring_7d" | "expiring_3d" | "expiring_1d" | "expired" | "unknown" | "revoked" | "test_failed";

export function calculateExpiry(issuedAt: string, expiresInSeconds: number): string {
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) throw new Error("有效时长必须为正整数秒数");
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued)) throw new Error("起算时间无效");
  return new Date(issued + expiresInSeconds * 1000).toISOString();
}

export function readableDuration(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400} 天`;
  if (seconds % 3600 === 0) return `${seconds / 3600} 小时`;
  if (seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${seconds} 秒`;
}

export function credentialStatus(expiry: CredentialExpiry, now = new Date(), providerState?: "revoked" | "expired" | "test_failed"): CredentialStatus {
  if (providerState === "revoked") return "revoked";
  if (providerState === "expired") return "expired";
  if (providerState === "test_failed") return "test_failed";
  if (!expiry.expiresAt) return "unknown";
  const remaining = Date.parse(expiry.expiresAt) - now.getTime();
  if (remaining <= 0) return "expired";
  if (remaining <= 86400000) return "expiring_1d";
  if (remaining <= 3 * 86400000) return "expiring_3d";
  if (remaining <= 7 * 86400000) return "expiring_7d";
  return "valid";
}

const SENSITIVE = /(access[_-]?token|authorization|api[_-]?key|authToken|password|secret)=([^&\s]+)/gi;
export function redactSensitive(value: string): string {
  return value.replace(/(Authorization\s*(?:=|:)\s*)(?:Bearer\s+)?[A-Za-z0-9._~+\/-]+/gi, "$1••••••••").replace(SENSITIVE, "$1=••••••••").replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer ••••••••");
}

export function requestPreview(config: AuthConfig, path = "/sse"): string {
  if (config.type === "bearer") return `GET ${path} · Authorization: Bearer ••••••••`;
  if (config.type === "api_key" && config.injectionMode === "protocol") return `协议专用注入 · ${config.executor ?? "Executor"} · ${config.parameterName ?? "credential"}=••••••••`;
  if (config.type === "api_key" && config.location === "query") return `GET ${path}?${config.parameterName ?? "token"}=••••••••`;
  if (config.type === "api_key") return `GET ${path} · ${config.location ?? "header"}:${config.parameterName ?? "token"}=••••••••`;
  if (config.type === "none") return `GET ${path} · 无认证`;
  return `GET ${path} · 凭证已脱敏`;
}

export function assertCallable(expiry: CredentialExpiry, providerState?: "revoked" | "expired" | "test_failed"): void {
  const status = credentialStatus(expiry, new Date(), providerState);
  if (status === "expired" || status === "revoked") throw new Error("凭证已过期或失效，请更新后重试");
}
