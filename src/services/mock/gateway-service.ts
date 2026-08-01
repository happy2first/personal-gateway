import { calls, endpoints, services } from "@/mocks/data";
import type { GatewayService, ServiceAuthRecord } from "@/services/contracts/gateway";
const wait=()=>new Promise(r=>setTimeout(r,100));
const authRecords:ServiceAuthRecord[]=[{serviceId:"baidu",status:"valid",authConfig:{type:"api_key",injectionMode:"standard",location:"query",parameterName:"access_token",credentialKey:"credential.baidu.primary",expiry:{mode:"duration",issuedAt:"2026-08-01T12:00:00.000Z",expiresInSeconds:2592000,expiresAt:"2026-08-31T12:00:00.000Z",source:"calculated"}}},{serviceId:"evernote",status:"unknown",authConfig:{type:"api_key",injectionMode:"protocol",parameterName:"authToken",credentialKey:"credential.evernote.primary",executor:"EdamExecutor",expiry:{mode:"unknown",source:"manual"}}}];
export const mockGatewayService:GatewayService={
 async services(){await wait();return services},async endpoints(){await wait();return endpoints},async calls(){await wait();return calls},
 async service(id){await wait();return services.find(x=>x.id===id)},async endpoint(id){await wait();return endpoints.find(x=>x.id===id)},async call(id){await wait();return calls.find(x=>x.id===id)},
 async serviceAuth(id){await wait();return authRecords.find(record=>record.serviceId===id)},async saveServiceAuth(record){await wait();const index=authRecords.findIndex(item=>item.serviceId===record.serviceId);if(index>=0)authRecords[index]=record;else authRecords.push(record);return record}
};
