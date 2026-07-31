import { z } from "zod";

export const statusSchema = z.enum(["normal", "warning", "error", "disabled", "draft"]);
export type EntityStatus = z.infer<typeof statusSchema>;
export type RiskLevel = "low" | "medium" | "high";

export interface GatewayEntity {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
  kind: string;
  updatedAt: string;
  risk?: RiskLevel;
  meta?: string;
}

export interface AuditLog extends GatewayEntity {
  client: string;
  tool: string;
  connection: string;
  duration: number;
  result: "success" | "failed" | "denied";
}

export interface GatewayService {
  list(section: string): Promise<GatewayEntity[]>;
  get(section: string, id: string): Promise<GatewayEntity | undefined>;
  logs(): Promise<AuditLog[]>;
}
