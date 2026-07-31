"use client";

import { AlertOutlined, ApiOutlined, BellOutlined, DashboardOutlined, DatabaseOutlined, MoreOutlined, SafetyCertificateOutlined, SettingOutlined, ToolOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Layout, Menu, Space, Tooltip } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

const { Sider } = Layout;
const nav = [
  { key: "/dashboard", label: "仪表盘", icon: <DashboardOutlined /> },
  { key: "tools", label: "工具与连接", icon: <ToolOutlined />, children: [
    { key: "/tools", label: "工具" }, { key: "/connections", label: "连接" },
  ] },
  { key: "access", label: "AI 接入", icon: <ApiOutlined />, children: [
    { key: "/publications", label: "Publication" }, { key: "/clients", label: "AI 客户端" }, { key: "/grants", label: "授权关系" },
  ] },
  { key: "observe", label: "日志与告警", icon: <AlertOutlined />, children: [
    { key: "/logs", label: "调用日志" }, { key: "/security-events", label: "安全事件" }, { key: "/alerts", label: "告警规则" },
  ] },
  { key: "/settings", label: "系统设置", icon: <SettingOutlined /> },
];

const mobile = [
  ["/dashboard", "首页", <DashboardOutlined key="d" />], ["/tools", "工具", <ToolOutlined key="t" />], ["/publications", "AI 接入", <ApiOutlined key="a" />], ["/logs", "日志", <DatabaseOutlined key="l" />], ["/settings", "更多", <MoreOutlined key="m" />],
] as const;

function activeKey(path: string) { return path === "/" ? "/dashboard" : `/${path.split("/").filter(Boolean).slice(0, 1).join("")}`; }

export function AppShell({ path, children }: { path: string; children: ReactNode }) {
  const selected = activeKey(path);
  const items = nav.map((item) => ({ ...item, label: item.children ? item.label : <Link href={item.key}>{item.label}</Link>, children: item.children?.map((c) => ({ ...c, label: <Link href={c.key}>{c.label}</Link> })) }));
  return <Layout className={styles.shell}>
    <Sider width={232} breakpoint="lg" collapsedWidth={80} className={styles.sider}>
      <div className={styles.brand}><span className={styles.brandMark}><SafetyCertificateOutlined /></span><span className="brandText">个人网关</span></div>
      <Menu mode="inline" selectedKeys={[selected]} defaultOpenKeys={["tools", "access", "observe"]} items={items} style={{ borderInlineEnd: 0 }} />
    </Sider>
    <div className={`${styles.body} ${styles.desktopBody}`}>
      <header className={styles.topbar}><Space><span className={styles.statusDot} />系统运行正常</Space><Space><Tooltip title="凭证到期与安全事件"><Badge count={3}><Button shape="circle" icon={<BellOutlined />} /></Badge></Tooltip><Avatar icon={<UserOutlined />} /><span>管理员</span></Space></header>
      <header className={styles.mobileTopbar}><Space><span className={styles.brandMark}><SafetyCertificateOutlined /></span><strong>个人网关</strong></Space><Badge count={3}><Button type="text" icon={<BellOutlined />} /></Badge></header>
      <main className={styles.content}>{children}</main>
    </div>
    <nav className={styles.bottomNav} aria-label="移动端主导航">{mobile.map(([href, label, icon]) => <Link key={href} href={href} className={`${styles.bottomItem} ${selected === href ? styles.bottomActive : ""}`}>{icon}<span>{label}</span></Link>)}</nav>
  </Layout>;
}
