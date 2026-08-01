import type { AuthConfig } from "@/services/credentials";
import { assertCallable, redactSensitive } from "@/services/credentials";

export interface SecretStore { decrypt(credentialKey: string): Promise<string> }

export class CredentialService {
  constructor(private readonly store: SecretStore) {}
  async resolve(config: AuthConfig): Promise<string | undefined> {
    if (config.type === "none") return undefined;
    if (!config.credentialKey) throw new Error("缺少 Credential Secret 引用");
    if (config.expiry) assertCallable(config.expiry);
    return this.store.decrypt(config.credentialKey);
  }
  safeError(error: unknown): string { return redactSensitive(error instanceof Error ? error.message : String(error)); }
}
