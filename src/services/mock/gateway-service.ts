import { mockEntities, mockLogs } from "@/mocks/data";
import type { GatewayService } from "@/services/contracts/gateway";

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockGatewayService: GatewayService = {
  async list(section) {
    await delay();
    return mockEntities[section] ?? [];
  },
  async get(section, id) {
    await delay();
    return (mockEntities[section] ?? []).find((item) => item.id === id);
  },
  async logs() {
    await delay();
    return mockLogs;
  },
};
