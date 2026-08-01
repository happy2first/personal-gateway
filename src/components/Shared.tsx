"use client";
import { Button, Drawer, Grid, Input, Space, Tag } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useState, type ReactNode } from "react";
import type { CredentialStatus } from "@/services/credentials";

export function SecretField({ value, onChange, placeholder = "请输入凭证", ariaLabel = "Token 值" }: { value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel?: string }) {
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  if (saved) return <Space.Compact block><Input aria-label={ariaLabel} readOnly value="••••••••••••"/><Button onClick={() => setSaved(false)}>重新输入</Button></Space.Compact>;
  return <Space.Compact block><Input aria-label={ariaLabel} type={visible ? "text" : "password"} value={value} placeholder={placeholder} autoComplete="new-password" onChange={event => onChange(event.target.value)}/><Button aria-label={visible ? "隐藏凭证" : "显示凭证"} icon={visible ? <EyeInvisibleOutlined/> : <EyeOutlined/>} onClick={() => setVisible(current => !current)}/><Button disabled={!value} onClick={() => setSaved(true)}>保存</Button></Space.Compact>;
}

export function ResponsiveDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  return <Drawer open={open} onClose={onClose} title={title} placement={mobile ? "bottom" : "right"} height={mobile ? "78vh" : undefined} width={mobile ? undefined : 640} destroyOnHidden>{children}</Drawer>;
}

const statusMap: Record<CredentialStatus, { color: string; label: string }> = {
  valid: { color: "success", label: "有效" }, expiring_7d: { color: "gold", label: "临近过期" }, expiring_3d: { color: "orange", label: "即将过期" }, expiring_1d: { color: "error", label: "高优先级即将过期" }, expired: { color: "error", label: "已过期" }, unknown: { color: "default", label: "有效期未知" }, revoked: { color: "error", label: "已撤销" }, test_failed: { color: "error", label: "测试失败" },
};
export function EntityStatusTag({ status }: { status: CredentialStatus }) { const item = statusMap[status]; return <Tag color={item.color}>{item.label}</Tag>; }
export function ConnectionHealth({ status }: { status: CredentialStatus }) { return <Space><span>凭证状态</span><EntityStatusTag status={status}/></Space>; }
