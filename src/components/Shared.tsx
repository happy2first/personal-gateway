"use client";

import { CheckCircleOutlined, CopyOutlined, ExclamationCircleOutlined, InboxOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Drawer, Empty, Result, Skeleton, Space, Tag, Tooltip, Typography, message } from "antd";
import type { ReactNode } from "react";
import type { EntityStatus, GatewayEntity, RiskLevel } from "@/services/contracts/gateway";
import styles from "./Shared.module.css";

export function PageHeader({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: ReactNode }) {
  return <div className={styles.header}><div><h1>{title}</h1>{subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}</div>{extra}</div>;
}

const statusMap: Record<EntityStatus, { color: string; text: string }> = {
  normal: { color: "success", text: "正常" }, warning: { color: "warning", text: "需关注" }, error: { color: "error", text: "异常" }, disabled: { color: "default", text: "已停用" }, draft: { color: "processing", text: "草稿" },
};
export function EntityStatusTag({ status }: { status: EntityStatus }) { const item = statusMap[status]; return <Tag color={item.color}>{item.text}</Tag>; }
export function RiskBadge({ risk = "low" }: { risk?: RiskLevel }) { const map = { low: ["success", "低风险"], medium: ["warning", "中风险"], high: ["error", "高风险"] } as const; return <Tag color={map[risk][0]}>{map[risk][1]}</Tag>; }
export function ConnectionHealth({ status }: { status: EntityStatus }) { return <Space size={4}>{status === "normal" ? <CheckCircleOutlined style={{ color: "var(--pg-success)" }} /> : <ExclamationCircleOutlined style={{ color: "var(--pg-warning)" }} />}<span>{status === "normal" ? "连接健康" : "需要检查"}</span></Space>; }

export function ResponsiveDataView({ items, onOpen }: { items: GatewayEntity[]; onOpen: (item: GatewayEntity) => void }) {
  const columns = ["名称", "类型", "状态", "风险", "更新时间", "操作"];
  return <>
    <div className={styles.desktopTable}>
      <div className="ant-table-wrapper"><div className="ant-table ant-table-bordered"><div className="ant-table-container"><div className="ant-table-content"><table style={{ width: "100%", tableLayout: "fixed" }}><thead className="ant-table-thead"><tr>{columns.map((c) => <th className="ant-table-cell" key={c}>{c}</th>)}</tr></thead><tbody className="ant-table-tbody">{items.map((item) => <tr className="ant-table-row" key={item.id}><td className="ant-table-cell"><Typography.Link onClick={() => onOpen(item)}>{item.name}</Typography.Link><div className={styles.subtitle}>{item.description}</div></td><td className="ant-table-cell">{item.kind}</td><td className="ant-table-cell"><EntityStatusTag status={item.status} /></td><td className="ant-table-cell"><RiskBadge risk={item.risk} /></td><td className="ant-table-cell">{item.updatedAt}</td><td className="ant-table-cell"><Button type="link" onClick={() => onOpen(item)}>查看</Button></td></tr>)}</tbody></table></div></div></div></div>
    </div>
    <div className={styles.mobileList}>{items.map((item) => <Card className={styles.card} key={item.id} onClick={() => onOpen(item)}><div className={styles.cardTitle}><strong>{item.name}</strong><EntityStatusTag status={item.status} /></div><p className={styles.subtitle}>{item.description}</p><div className={styles.meta}><Tag>{item.kind}</Tag><RiskBadge risk={item.risk} /><span>{item.updatedAt}</span></div></Card>)}</div>
  </>;
}

export function ResponsiveDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return <Drawer open={open} onClose={onClose} title={title} width={560} destroyOnClose>{children}</Drawer>;
}
export const FilterDrawer = ResponsiveDrawer;
export function EmptyState({ text = "暂无数据" }: { text?: string }) { return <Empty image={<InboxOutlined style={{ fontSize: 42 }} />} description={text} />; }
export function ErrorState({ onRetry }: { onRetry?: () => void }) { return <Result status="error" title="加载失败" subTitle="Mock Service 暂时无法响应" extra={onRetry ? <Button icon={<ReloadOutlined />} onClick={onRetry}>重试</Button> : null} />; }
export function LoadingState() { return <Card><Skeleton active paragraph={{ rows: 6 }} /></Card>; }
export function CodePreview({ value }: { value: string }) { return <pre className={styles.code}><code>{value}</code></pre>; }
export function SecretField({ prefix = "pg_live_82a1" }: { prefix?: string }) { return <div className={styles.secret}><LockOutlined /><span>{prefix}••••••••••••</span><Tooltip title="保存后仅保留前缀"><Tag>已掩码</Tag></Tooltip></div>; }
export function CopyableEndpoint({ value }: { value: string }) { const [api, holder] = message.useMessage(); return <>{holder}<Space.Compact style={{ width: "100%" }}><Typography.Text code copyable={false} style={{ flex: 1, padding: 10, border: "1px solid var(--pg-border)", borderRadius: "8px 0 0 8px" }}>{value}</Typography.Text><Button icon={<CopyOutlined />} onClick={async () => { await navigator.clipboard?.writeText(value); api.success("端点已复制"); }}>复制</Button></Space.Compact></>; }
export function ConfirmAction({ title, onConfirm, children }: { title: string; onConfirm: () => void; children: ReactNode }) { return <Button danger onClick={() => { if (window.confirm(title)) onConfirm(); }}>{children}</Button>; }
export function WarningBanner({ children }: { children: ReactNode }) { return <Alert showIcon type="warning" message={children} style={{ marginBottom: 16 }} />; }
export { styles as sharedStyles };
