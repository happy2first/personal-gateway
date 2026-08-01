import { calls, endpoints, services } from "@/mocks/data";
import type { GatewayService } from "@/services/contracts/gateway";
const wait=()=>new Promise(r=>setTimeout(r,100));
export const mockGatewayService:GatewayService={
 async services(){await wait();return services},async endpoints(){await wait();return endpoints},async calls(){await wait();return calls},
 async service(id){await wait();return services.find(x=>x.id===id)},async endpoint(id){await wait();return endpoints.find(x=>x.id===id)},async call(id){await wait();return calls.find(x=>x.id===id)}
};
