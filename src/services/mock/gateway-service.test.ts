import { describe, expect, it } from "vitest";
import { mockGatewayService } from "./gateway-service";

describe("mockGatewayService", () => {
  it("returns linked tools and logs", async () => {
    const [tools, logs] = await Promise.all([mockGatewayService.list("tools"), mockGatewayService.logs()]);
    expect(tools.some((item) => item.id === "mail-search")).toBe(true);
    expect(logs[0].connection).toBe("我的 QQ 邮箱");
  });
});
