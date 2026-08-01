import { z } from "zod";
import type { AuthConfig, CredentialStatus } from "@/services/credentials";

export const statusSchema=z.enum(["running","error","untested","disabled"]);
export type Status=z.infer<typeof statusSchema>;
export type Permission="allow"|"confirm"|"deny";

export interface Capability { id:string; name:string; description:string; risk:"read"|"write"|"delete"; permission:Permission }
export interface Service { id:string; name:string; code:string; description:string; category:string; type:"MCP"|"API"|"邮箱"; status:Status; transport:string; updatedAt:string; capabilities:Capability[] }
export interface Caller { id:string; vendor:string; name:string; auth:string; status:Status }
export interface Endpoint { id:string; name:string; description:string; protocol:"MCP"|"OpenAPI"; status:Status; url:string; successRate:number; calls:number; serviceIds:string[]; callers:Caller[] }
export interface Call { id:string; time:string; client:string; endpointId:string; endpointProtocol:"MCP"|"OpenAPI"; serviceId:string; serviceType:"MCP"|"API"|"邮箱"; capabilityId:string; externalCapability:string; conversionType:string; result:"success"|"failed"; duration:number; message:string; upstreamError:string }
export interface ServiceAuthRecord { serviceId:string; authConfig:AuthConfig; status:CredentialStatus; lastTestedAt?:string; errorSummary?:string }
export interface GatewayService {
  services():Promise<Service[]>; endpoints():Promise<Endpoint[]>; calls():Promise<Call[]>;
  service(id:string):Promise<Service|undefined>; endpoint(id:string):Promise<Endpoint|undefined>; call(id:string):Promise<Call|undefined>;
  serviceAuth(id:string):Promise<ServiceAuthRecord|undefined>; saveServiceAuth(record:ServiceAuthRecord):Promise<ServiceAuthRecord>;
}
