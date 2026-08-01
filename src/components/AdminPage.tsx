"use client";

import { ApiOutlined, DeleteOutlined, FilterOutlined, KeyOutlined, MailOutlined, PlusOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Collapse, Descriptions, Drawer, Empty, Form, Input, InputNumber, Modal, Radio, Select, Skeleton, Space, Switch, Table, Tabs, Tag, TimePicker, Timeline, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardCharts } from "./Charts";
import { EndpointWizard, ServiceWizard } from "./Wizards";
import { mockGatewayService } from "@/services/mock/gateway-service";
import type { Call, Endpoint, Service, Status } from "@/services/contracts/gateway";
import { calls as allCalls, endpoints as allEndpoints, services as allServices } from "@/mocks/data";
import styles from "./Gateway.module.css";

const statusMap: Record<Status, { text: string; color: string }> = {
  running: { text: "运行中", color: "success" }, error: { text: "异常", color: "error" },
  untested: { text: "未测试", color: "default" }, disabled: { text: "已停用", color: "default" },
};
function StatusTag({ value }: { value: Status }) { const item = statusMap[value]; return <Tag color={item.color}>{item.text}</Tag>; }
function Header({ title, subtitle, extra }: { title: string; subtitle: string; extra?: React.ReactNode }) { return <div className={styles.pageHeader}><div><h1>{title}</h1><div className={styles.subtitle}>{subtitle}</div></div>{extra}</div>; }
function Loading() { return <Card><Skeleton active paragraph={{ rows: 6 }}/></Card>; }
const serviceName = (id: string) => allServices.find(item => item.id === id)?.name ?? id;
const endpointName = (id: string) => allEndpoints.find(item => item.id === id)?.name ?? id;
const capabilityName = (serviceId: string, capabilityId: string) => allServices.find(item => item.id === serviceId)?.capabilities.find(item => item.id === capabilityId)?.name ?? capabilityId;

export function AdminPage({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean); const root = parts[0] ?? "dashboard"; const id = parts[1];
  if (root === "dashboard") return <Dashboard/>;
  if (root === "services" && id === "new") return <><Header title="新增服务" subtitle="连接上游服务、完成认证测试并发现原始能力"/><ServiceWizard/></>;
  if (root === "services" && id) return <ServiceDetail id={id}/>;
  if (root === "services") return <ServiceList/>;
  if (root === "endpoints" && id === "new") return <><Header title="新增端点" subtitle="选择服务与能力，并发布为 MCP 或 OpenAPI API"/><EndpointWizard/></>;
  if (root === "endpoints" && id) return <EndpointDetail id={id}/>;
  if (root === "endpoints") return <EndpointList/>;
  if (root === "calls" && id) return <CallDetail id={id}/>;
  if (root === "calls") return <CallList/>;
  if (root === "settings") return <Settings/>;
  return <Card><Empty description="页面不存在"/></Card>;
}

function AvailabilityCard({ title, items, total }: { title: string; items: { name: string; status: Status }[]; total: number }) {
  const available = items.filter(item => item.status === "running").length;
  return <Card title={title} extra={<strong>{available}/{total} 可用</strong>} className={styles.healthCard}>
    {items.map(item => <div className={styles.healthRow} key={item.name}><span>{item.name}</span><StatusTag value={item.status}/></div>)}
  </Card>;
}

function Dashboard() {
  return <><Header title="个人网关" subtitle="服务、端点与高危能力运行概览" extra={<StatusTag value="running"/>}/>
    <Alert className={styles.noticeCard} type="warning" showIcon icon={<WarningOutlined/>} message="“我的百度网盘”凭证将在 5 天后到期" description="建议及时更新，避免端点调用失败。" action={<Button size="small" href="/services/baidu">立即处理</Button>}/>
    <div className={styles.availabilityGrid}>
      <AvailabilityCard title="服务当前可用情况" total={allServices.length} items={allServices.map(item => ({ name: item.name, status: item.status }))}/>
      <AvailabilityCard title="端点当前可用情况" total={allEndpoints.length} items={allEndpoints.map(item => ({ name: item.name, status: item.status }))}/>
    </div>
    <DashboardCharts/>
  </>;
}

function ServiceList() {
  const [data, setData] = useState<Service[] | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => { void mockGatewayService.services().then(items => { setData(items); setEnabled(Object.fromEntries(items.map(item => [item.id, item.status === "running"]))); }); }, []);
  return <><Header title="全部服务" subtitle="接入并管理上游个人数字服务" extra={<Button type="primary" icon={<PlusOutlined/>} href="/services/new">新增服务</Button>}/>
    {!data ? <Loading/> : data.length ? <div className={styles.cards}>{data.map(service => <Card key={service.id} hoverable className={styles.entity}>
      <div className={styles.entityTop}><Link className={styles.entityLink} href={"/services/" + service.id}><h3>{service.name}</h3><div className={styles.muted}>{service.description}</div></Link><Switch aria-label={service.name + "启停"} checked={enabled[service.id]} onChange={checked => { setEnabled(value => ({ ...value, [service.id]: checked })); message.success(service.name + (checked ? "已启用" : "已停用")); }}/></div>
      <Link href={"/services/" + service.id}><div className={styles.entityMeta}><Tag>{service.type}</Tag><span>{service.capabilities.length} 项能力</span><span>{service.transport}</span><StatusTag value={enabled[service.id] ? "running" : "disabled"}/></div></Link>
    </Card>)}</div> : <Card className={styles.empty}><Empty description="暂无服务"/><Button type="primary" href="/services/new">新增服务</Button></Card>}
  </>;
}

function ServiceDetail({ id }: { id: string }) {
  const [item, setItem] = useState<Service>();
  useEffect(() => { void mockGatewayService.service(id).then(setItem); }, [id]);
  if (!item) return <Loading/>;
  const capabilities = <Space direction="vertical" style={{ width: "100%" }}>{item.capabilities.map(capability => <Card size="small" key={capability.id}><div className={styles.capRow}><span><strong>{capability.name}</strong><br/><small className={styles.muted}>{capability.id} · {capability.description}</small></span><Tag>{capability.risk === "read" ? "只读" : capability.risk === "delete" ? "高危" : "写入"}</Tag></div></Card>)}</Space>;
  const overview = <div className={styles.detailGrid}><Card title="基本信息"><div className={styles.tableScroll}><Descriptions column={{ xs: 1, sm: 2 }} items={[{ key: "code", label: "服务标识", children: item.code }, { key: "type", label: "类型", children: item.type }, { key: "status", label: "状态", children: <StatusTag value={item.status}/> }, { key: "transport", label: "连接方式", children: item.transport }, { key: "updated", label: "更新时间", children: item.updatedAt }]}/></div></Card><Card title="运行控制"><Space direction="vertical" style={{ width: "100%" }}><Switch defaultChecked checkedChildren="已启用" unCheckedChildren="已停用"/><Button block href={"/calls?service=" + item.id}>查看调用记录</Button></Space></Card></div>;
  return <><Header title={item.name} subtitle={item.description} extra={<Space><StatusTag value={item.status}/><Button disabled>编辑（暂不可用）</Button></Space>}/><Card className={styles.detailCard}><Tabs tabBarGutter={24} items={[
    { key: "overview", label: "概览", children: overview }, { key: "capabilities", label: "原始能力", children: capabilities },
    { key: "connection", label: "连接与认证", children: <><Alert type="info" showIcon message="这里只管理上游连接与认证" description="界面不显示任何密钥；对外认证在端点发布中配置。"/><div className={styles.tableScroll}><Descriptions style={{ marginTop: 16 }} column={1} bordered items={[{ key: "transport", label: "上游连接方式", children: item.transport }, { key: "auth", label: "上游认证", children: "已配置（已脱敏）" }, { key: "expire", label: "凭证有效期", children: <Tag color="warning">2026-08-06 到期</Tag> }, { key: "tls", label: "TLS", children: "已启用" }]}/></div><Button type="primary" icon={<KeyOutlined/>} style={{ marginTop: 16 }} onClick={() => message.info("打开重新配置令牌与有效期表单")}>重新配置令牌与有效期</Button></> },
    { key: "test", label: "测试", children: <Space direction="vertical" style={{ width: "100%" }}><Alert type="success" showIcon message="最近一次模拟测试成功"/><Timeline items={[{ color: "green", children: "18:32 连接测试成功" }, { color: "blue", children: "18:31 保存原始能力结构快照" }]}/><Button type="primary" icon={<ReloadOutlined/>} onClick={() => message.success("连接及原始能力测试成功")}>重新测试</Button></Space> },
    { key: "linked", label: "关联端点", children: <div className={styles.cards}>{allEndpoints.filter(endpoint => endpoint.serviceIds.includes(item.id)).map(endpoint => <Link key={endpoint.id} href={"/endpoints/" + endpoint.id}><Card hoverable><div className={styles.entityTop}><strong>{endpoint.name}</strong><StatusTag value={endpoint.status}/></div><div className={styles.entityMeta}><Tag>{endpoint.protocol}</Tag><span>{item.capabilities.length} 项能力</span></div></Card></Link>)}</div> },
    { key: "calls", label: "调用记录", children: <RecentCalls serviceId={item.id} limit={5}/> },
  ]}/></Card></>;
}

function EndpointList() {
  const [data, setData] = useState<Endpoint[] | null>(null); const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => { void mockGatewayService.endpoints().then(items => { setData(items); setEnabled(Object.fromEntries(items.map(item => [item.id, item.status === "running"]))); }); }, []);
  return <><Header title="端点发布" subtitle="组合服务能力并对外发布标准端点" extra={<Button type="primary" icon={<PlusOutlined/>} href="/endpoints/new">新增端点</Button>}/>{!data ? <Loading/> : <div className={styles.cards}>{data.map(endpoint => <Card hoverable className={styles.entity} key={endpoint.id}>
    <div className={styles.entityTop}><Link className={styles.entityLink} href={"/endpoints/" + endpoint.id}><h3>{endpoint.name}</h3><div className={styles.muted}>{endpoint.description}</div></Link><Switch aria-label={endpoint.name + "启停"} checked={enabled[endpoint.id]} onChange={checked => { setEnabled(value => ({ ...value, [endpoint.id]: checked })); message.success(endpoint.name + (checked ? "已启用" : "已停用")); }}/></div>
    <Link href={"/endpoints/" + endpoint.id}><div className={styles.entityMeta}><Tag color="blue">{endpoint.protocol}</Tag><span>{endpoint.serviceIds.length} 个服务</span><span>{endpoint.callers.length} 个调用方</span><span>{endpoint.calls} 次 · {endpoint.successRate}%</span><StatusTag value={enabled[endpoint.id] ? "running" : "disabled"}/></div></Link>
  </Card>)}</div>}</>;
}

function EndpointDetail({ id }: { id: string }) {
  const [item, setItem] = useState<Endpoint>(); useEffect(() => { void mockGatewayService.endpoint(id).then(setItem); }, [id]); if (!item) return <Loading/>;
  const overview = <div className={styles.detailGrid}><Card title="端点信息"><div className={styles.tableScroll}><Descriptions column={1} bordered items={[{ key: "protocol", label: "协议", children: item.protocol }, { key: "status", label: "状态", children: <StatusTag value={item.status}/> }, { key: "url", label: "端点地址", children: <Input readOnly value={item.url} addonAfter={<Button type="link">复制</Button>}/> }, { key: "rate", label: "成功率", children: item.successRate + "%" }, { key: "calls", label: "今日调用", children: item.calls + " 次" }]}/></div></Card><Card title="运行控制"><Space direction="vertical" style={{ width: "100%" }}><Switch defaultChecked checkedChildren="运行中" unCheckedChildren="已停用"/><Button href={"/calls?endpoint=" + item.id} block>查看调用记录</Button></Space></Card></div>;
  const conversions = <Space direction="vertical" style={{ width: "100%" }}>{item.serviceIds.map(serviceId => { const service = allServices.find(value => value.id === serviceId)!; return <Collapse key={serviceId} items={[{ key: serviceId, label: <Space><strong>{service.name}</strong><Tag color="blue">{service.type + " → " + item.protocol}</Tag></Space>, children: <div className={styles.tableScroll}><Descriptions column={1} bordered items={service.capabilities.slice(0, 3).map(capability => ({ key: capability.id, label: capability.name, children: <Space direction="vertical"><span>原始能力：<code>{capability.id}</code></span><span>对外能力：<code>{item.protocol === "MCP" ? capability.id.replace(/-/g, "_") : "/" + capability.id.replace(/-/g, "/")}</code></span><span>对外结构：已生成</span><StatusTag value="running"/></Space> }))}/></div> }]}/>; })}</Space>;
  const callers = <div className={styles.cards}>{item.callers.map(caller => <Card key={caller.id}><div className={styles.entityTop}><strong>{caller.name}</strong><StatusTag value={caller.status}/></div><p className={styles.muted}>{caller.vendor} · {caller.auth}</p><Space wrap><Button>独立授权</Button><Button>查看日志</Button></Space></Card>)}</div>;
  return <><Header title={item.name} subtitle={item.description} extra={<Space><StatusTag value={item.status}/><Button disabled>编辑（暂不可用）</Button></Space>}/><Card className={styles.detailCard}><Tabs items={[
    { key: "overview", label: "概览", children: overview }, { key: "conversion", label: "能力与转换", children: conversions }, { key: "permission", label: "权限", children: <PermissionSummary serviceIds={item.serviceIds}/> },
    { key: "auth", label: "认证", children: <Space direction="vertical" style={{ width: "100%" }}><Alert type="info" showIcon message={item.protocol === "MCP" ? "下游 OAuth 2.1 已配置" : "下游 API Key 已配置"} description="令牌只展示摘要，不显示完整值。"/><div className={styles.tableScroll}><Descriptions bordered column={1} items={[{ key: "expire", label: "令牌有效期", children: "2026-10-30 23:59" }, { key: "remaining", label: "剩余时间", children: <Tag color="success">90 天</Tag> }]}/></div><Button type="primary" icon={<ReloadOutlined/>} onClick={() => Modal.confirm({ title: "重新生成令牌？", content: "旧令牌将立即失效，所有调用方需要更新配置。", okText: "重新生成", onOk: () => message.success("已生成新的模拟令牌") })}>重新生成令牌</Button></Space> },
    { key: "callers", label: "调用方", children: callers }, { key: "test", label: "测试", children: <><Alert type="success" showIcon message="端点协议、转换、权限和调用方模拟测试通过"/><Button style={{ marginTop: 16 }}>重新测试</Button></> }, { key: "calls", label: "调用记录", children: <RecentCalls endpointId={item.id} limit={5}/> },
  ]}/></Card></>;
}

function PermissionSummary({ serviceIds }: { serviceIds: string[] }) { return <Space direction="vertical" style={{ width: "100%" }}>{serviceIds.map(id => { const service = allServices.find(item => item.id === id)!; return <Collapse key={id} items={[{ key: id, label: <strong>{service.name}</strong>, children: service.capabilities.map(capability => <div className={styles.envRow} key={capability.id}><span>{capability.name}</span><Tag color={capability.permission === "allow" ? "success" : capability.permission === "deny" ? "error" : "warning"}>{capability.permission === "allow" ? "允许" : capability.permission === "deny" ? "禁止" : "每次确认"}</Tag></div>) }]}/>; })}</Space>; }
function RecentCalls({ limit = 5, serviceId, endpointId }: { limit?: number; serviceId?: string; endpointId?: string }) { const data = allCalls.filter(item => (!serviceId || item.serviceId === serviceId) && (!endpointId || item.endpointId === endpointId)).slice(0, limit); return <Card title="最近调用" extra={<Button type="link" href="/calls">查看全部</Button>}><CallViews data={data}/></Card>; }
function CallViews({ data }: { data: Call[] }) {
  const columns = [{ title: "时间", dataIndex: "time", render: (value: string) => value.slice(11) }, { title: "调用方", key: "client", render: (_: unknown, row: Call) => row.client }, { title: "端点", key: "endpoint", render: (_: unknown, row: Call) => endpointName(row.endpointId) }, { title: "服务", key: "service", render: (_: unknown, row: Call) => serviceName(row.serviceId) }, { title: "能力", key: "cap", render: (_: unknown, row: Call) => capabilityName(row.serviceId, row.capabilityId) }, { title: "转换类型", dataIndex: "conversionType" }, { title: "结果", dataIndex: "result", render: (value: string) => <Tag color={value === "success" ? "success" : "error"}>{value === "success" ? "成功" : "失败"}</Tag> }, { title: "耗时", dataIndex: "duration", render: (value: number) => value + " 毫秒" }, { title: "请求编号", dataIndex: "id", render: (value: string) => <Link href={"/calls/" + value}>{value}</Link> }];
  return data.length ? <><div className={styles.desktopTable}><Table rowKey="id" size="small" pagination={false} dataSource={data} columns={columns} scroll={{ x: 980 }}/></div><div className={styles.mobileCards}>{data.map(item => <Link href={"/calls/" + item.id} key={item.id}><Card size="small"><div className={styles.entityTop}><strong>{capabilityName(item.serviceId, item.capabilityId)}</strong><Tag color={item.result === "success" ? "success" : "error"}>{item.result === "success" ? "成功" : "失败"}</Tag></div><div className={styles.entityMeta}><span>{item.time.slice(11)}</span><span>{item.client}</span><span>{serviceName(item.serviceId)}</span><span>{item.duration} 毫秒</span></div></Card></Link>)}</div></> : <Empty description="暂无调用记录"/>;
}
function CallList() {
  const [data, setData] = useState<Call[] | null>(null); const [drawer, setDrawer] = useState(false); const [filters, setFilters] = useState({ vendor: "", endpoint: "", service: "", result: "", keyword: "" });
  useEffect(() => { const query = new URLSearchParams(window.location.search); queueMicrotask(() => setFilters(value => ({ ...value, endpoint: query.get("endpoint") ?? "", service: query.get("service") ?? "", result: query.get("result") ?? "" }))); void mockGatewayService.calls().then(setData); }, []);
  const shown = useMemo(() => data?.filter(item => (!filters.vendor || item.vendor === filters.vendor) && (!filters.endpoint || item.endpointId === filters.endpoint) && (!filters.service || item.serviceId === filters.service) && (!filters.result || item.result === filters.result) && (!filters.keyword || (item.id + item.client + item.message).toLowerCase().includes(filters.keyword.toLowerCase()))) ?? [], [data, filters]);
  const form = <Form layout="vertical"><Form.Item label="时间"><Select defaultValue="today" options={[{ label: "今天", value: "today" }, { label: "最近 7 天", value: "7d" }, { label: "最近 30 天", value: "30d" }]}/></Form.Item><Form.Item label="厂商"><Select allowClear value={filters.vendor || undefined} onChange={value => setFilters(item => ({ ...item, vendor: value ?? "" }))} options={["OpenAI", "Anthropic", "Google"].map(value => ({ label: value, value }))}/></Form.Item><Form.Item label="端点"><Select allowClear value={filters.endpoint || undefined} onChange={value => setFilters(item => ({ ...item, endpoint: value ?? "" }))} options={allEndpoints.map(item => ({ label: item.name, value: item.id }))}/></Form.Item><Form.Item label="服务"><Select allowClear value={filters.service || undefined} onChange={value => setFilters(item => ({ ...item, service: value ?? "" }))} options={allServices.map(item => ({ label: item.name, value: item.id }))}/></Form.Item><Form.Item label="调用结果"><Select allowClear value={filters.result || undefined} onChange={value => setFilters(item => ({ ...item, result: value ?? "" }))} options={[{ label: "成功", value: "success" }, { label: "失败", value: "failed" }]}/></Form.Item><Form.Item label="关键词"><Input.Search value={filters.keyword} onChange={event => setFilters(item => ({ ...item, keyword: event.target.value }))}/></Form.Item></Form>;
  return <><Header title="调用记录" subtitle="统一记录调用方 → 端点 → 服务 → 能力 → 结果" extra={<Button icon={<FilterOutlined/>} onClick={() => setDrawer(true)}>筛选</Button>}/><Card><div className={styles.desktopTable}>{form}</div>{!data ? <Skeleton active/> : <CallViews data={shown}/>}</Card><Drawer open={drawer} title="筛选调用记录" placement="bottom" height="90%" onClose={() => setDrawer(false)}>{form}<Button type="primary" block onClick={() => setDrawer(false)}>应用筛选</Button></Drawer></>;
}
function CallDetail({ id }: { id: string }) { const item = allCalls.find(value => value.id === id); if (!item) return <Card><Empty description="调用记录不存在"/></Card>; const chain = [["调用方", item.client], ["端点", endpointName(item.endpointId)], ["对外能力", item.externalCapability], ["来源服务", serviceName(item.serviceId)], ["原始能力", capabilityName(item.serviceId, item.capabilityId)], ["上游结果", item.result === "success" ? "成功" : "失败"]]; return <><Header title="调用详情" subtitle={item.id} extra={<Tag color={item.result === "success" ? "success" : "error"}>{item.result === "success" ? "成功" : "失败"}</Tag>}/><div className={styles.detailGrid}><Card title="完整调用链" className={styles.full}><div className={styles.flow}>{chain.map(([name, value]) => <span key={name} className={styles.flowNode}>{name}<br/><strong>{value}</strong></span>)}</div></Card><Card title="请求信息"><Descriptions column={1} items={[{ key: "time", label: "时间", children: item.time }, { key: "vendor", label: "厂商", children: item.vendor }, { key: "protocol", label: "端点协议", children: item.endpointProtocol }, { key: "type", label: "服务类型", children: item.serviceType }, { key: "conversion", label: "转换类型", children: item.conversionType }, { key: "duration", label: "耗时", children: item.duration + " 毫秒" }, { key: "id", label: "请求编号", children: item.id }]}/></Card><Card title="上游结果"><Alert type={item.result === "success" ? "success" : "error"} showIcon message={item.message} description={"上游错误摘要：" + item.upstreamError}/></Card></div></>; }

function Settings() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const confirmClear = () => Modal.confirm({ title: "确认清空调用记录？", content: "此操作不可撤销。当前为模拟数据，不会删除真实数据。", okText: "清空", okButtonProps: { danger: true } });
  return <><Header title="设置" subtitle="运行控制、数据、系统状态、身份认证与通知"/><div className={styles.settingsStack}>
    <Card title="运行控制"><Space wrap><Tag color="success">运行中</Tag><Button onClick={() => Modal.confirm({ title: "确认暂停网关？", content: "暂停后所有调用将被阻断。", okText: "确认暂停" })}>暂停</Button><Button type="primary" disabled>恢复</Button></Space></Card>
    <Card title="数据"><div className={styles.dataSettings}><Form.Item label="调用记录保留"><Radio.Group defaultValue={90} options={[30, 90, 180].map(value => ({ label: value + " 天", value }))}/></Form.Item><Button danger icon={<DeleteOutlined/>} onClick={confirmClear}>清空记录</Button></div></Card>
    <Card title="系统状态"><div className={styles.tableScroll}><Descriptions column={{ xs: 1, sm: 2 }} bordered items={[["Supabase", "正常"], ["Upstash", "正常"], ["Resend", "正常"], ["Vercel", "正常"], ["版本号", "v0.3.0-prototype"], ["部署时间", "2026-08-01"]].map(([name, value]) => ({ key: name, label: name, children: value === "正常" ? <StatusTag value="running"/> : value }))}/></div></Card>
    <Card title="身份认证"><Descriptions column={1} items={[{ key: "provider", label: "认证服务", children: "Supabase Auth" }, { key: "password", label: "密码登录", children: <Tag color="success">可用</Tag> }, { key: "passkey", label: "Passkey", children: <Tag>即将支持</Tag> }]}/><Button icon={<KeyOutlined/>} onClick={() => setPasswordOpen(true)}>修改密码</Button></Card>
    <Card title="通知设置"><Form layout="vertical" className={styles.notificationForm}><Form.Item label="接收邮箱" extra="用于接收网关通知，不是管理员账号。"><Input prefix={<MailOutlined/>} defaultValue="notify@example.com"/></Form.Item><div className={styles.settingRow}><div><strong>到期通知</strong><div className={styles.muted}>凭证或令牌临近到期时通知</div></div><Switch defaultChecked/></div><Form.Item label="提前通知天数"><InputNumber min={1} max={90} defaultValue={7} addonAfter="天"/></Form.Item><div className={styles.settingRow}><div><strong>非常用时段端点调用通知</strong><div className={styles.muted}>在设定时段发生调用时通知</div></div><Switch defaultChecked/></div><Form.Item label="非常用时段"><TimePicker.RangePicker defaultValue={undefined} format="HH:mm" placeholder={["开始时间", "结束时间"]}/></Form.Item><div className={styles.settingRow}><div><strong>高危能力调用通知</strong><div className={styles.muted}>高危能力被调用或确认时通知</div></div><Switch defaultChecked/></div><Form.Item label="高危能力定义"><Select mode="multiple" defaultValue={["删除", "发送", "上传", "下载附件"]} options={["删除", "发送", "上传", "下载附件", "转账", "下单"].map(value => ({ label: value, value }))}/></Form.Item><Button type="primary" icon={<ApiOutlined/>} onClick={() => message.success("模拟测试通知发送成功")}>发送测试通知</Button></Form></Card>
  </div><Modal open={passwordOpen} title="修改密码" okText="确认修改" cancelText="取消" onCancel={() => setPasswordOpen(false)} onOk={() => { setPasswordOpen(false); message.success("密码修改成功（模拟）"); }}><Form layout="vertical"><Form.Item label="当前密码" required><Input.Password/></Form.Item><Form.Item label="新密码" required><Input.Password/></Form.Item><Form.Item label="确认新密码" required><Input.Password/></Form.Item></Form></Modal></>;
}
