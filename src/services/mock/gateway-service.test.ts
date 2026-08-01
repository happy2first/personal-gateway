import { describe, expect, it } from "vitest";
import { mockGatewayService } from "./gateway-service";
describe("mock gateway service",()=>{it("keeps relations valid",async()=>{const [services,endpoints,calls]=await Promise.all([mockGatewayService.services(),mockGatewayService.endpoints(),mockGatewayService.calls()]);expect(services.length).toBeGreaterThan(0);expect(endpoints.every(e=>e.serviceIds.every(id=>services.some(s=>s.id===id)))).toBe(true);expect(calls.every(c=>services.some(s=>s.id===c.serviceId)&&endpoints.some(e=>e.id===c.endpointId))).toBe(true)})});
