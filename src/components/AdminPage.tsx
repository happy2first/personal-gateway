"use client";

import {
  ApiOutlined, DeleteOutlined, FilterOutlined, KeyOutlined, MailOutlined,
  PlusOutlined, ReloadOutlined, RightOutlined, WarningOutlined,
} from "@ant-design/icons";
import {
  Alert, Badge, Button, Card, Collapse, DatePicker, Descriptions, Drawer, Empty,
  Form, Input, InputNumber, List, Modal, Radio, Select, Skeleton, Space, Switch,
  Table, Tabs, Tag, TimePicker, Timeline, message,
} from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardCharts } from "./Charts";
import { EndpointWizard, ServiceWizard } from "./Wizards";
import { mockGatewayService } from "@/services/mock/gateway-service";
import type { Call, Endpoint, Service, Status } from "@/services/contracts/gateway";
import { calls as allCalls, endpoints as allEndpoints, services as allServices } from "@/mocks/data";
import styles from "./Gateway.module.css";

const statusMap: Record<Status, { text: string; color: string }> = {
  running: { text: "运行中", color: "success" },
  error: { text: "异常", color: "error" },
  untested: { text: "未测试", color: "default" },
  disabled: { text: "已停用", color: "default" },
};
const serviceName = (id: string) => allServices.find(item => item.id === id)?.name ?? id;
const endpointName = (id: string) => allEndpoints.find(item => item.id === id)?.name ?? id;
const capabilityName = (serviceId: string, capabilityId: string) => allServices.find(item => item.id === serviceId)?.capabilities.find(item => item.id === capabilityId)?.name ?? capabilityId;
function StatusTag({ value }: { value: Status }) { const item = statusMap[value]; return <Tag color={item.color}>{item.text}</Tag>; }
function Header({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: React.ReactNode }) {
  return <div className={styles.pageHeader}><div><h1>{title}</h1>{subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}</div>{extra}</div>;
}
function Loading() { return <Card><Skeleton active paragraph={{ rows: 6 }}/></Card>; }
function MobileKeyValues({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return <div className={styles.mobileKeyValues}>{items.map(item => <div className={styles.mobileKeyValue} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}

export function AdminPage({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  const root = parts[0] ?? "dashboard"; const id = parts[1]; const section = parts[2];
  if (root === "dashboard") return <Dashboard/>;
  if (root === "services" && id === "new") return <><div className={styles.desktopOnly}><Header title="新增服务" subtitle="连接上游服务、完成认证测试并发现原始能力"/></div><ServiceWizard/></>;
  if (root === "services" && id) return <ServiceDetail id={id} section={section}/>;
  if (root === "services") return <ServiceList/>;
  if (root === "endpoints" && id === "new") return <><div className={styles.desktopOnly}><Header title="新增端点" subtitle="选择服务与能力，并发布为 MCP 或 OpenAPI API"/></div><EndpointWizard/></>;
  if (root === "endpoints" && id) return <EndpointDetail id={id} section={section}/>;
  if (root === "endpoints") return <EndpointList/>;
  if (root === "calls" && id) return <CallDetail id={id}/>;
  if (root === "calls") return <CallList/>;
  if (root === "settings") return <Settings/>;
  return <Card><Empty description="页面不存在"/></Card>;
}

function AvailabilityCard({ title, items }: { title: string; items: { name: string; status: Status }[] }) {
  const available = items.filter(item => item.status === "running").length;
  return <Card title={title} extra={<strong>{available}/{items.length} 可用</strong>}>
    {items.map(item => <div className={styles.healthRow} key={item.name}><span>{item.name}</span><StatusTag value={item.status}/></div>)}
  </Card>;
}
function Dashboard() {
  return <><Header title="个人网关" subtitle="服务、端点与高危能力运行概览" extra={<StatusTag value="running"/>}/>
    <Alert className={styles.noticeCard} type="warning" showIcon icon={<WarningOutlined/>} message="“我的百度网盘”凭证将在 5 天后到期" description="建议及时更新，避免端点调用失败。" action={<Button size="small" href="/services/baidu">立即处理</Button>}/>
    <div className={styles.availabilityGrid}>
      <AvailabilityCard title="服务当前可用情况" items={allServices.map(item => ({ name: item.name, status: item.status }))}/>
      <AvailabilityCard title="端点当前可用情况" items={allEndpoints.map(item => ({ name: item.name, status: item.status }))}/>
    </div><DashboardCharts/>
  </>;
}

function ServiceList() {
  const [data, setData] = useState<Service[] | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => { void mockGatewayService.services().then(items => { setData(items); setEnabled(Object.fromEntries(items.map(item => [item.id, item.status === "running"]))); }); }, []);
  return <><Header title="全部服务" subtitle="接入并管理上游个人数字服务" extra={<Button type="primary" icon={<PlusOutlined/>} href="/services/new">新增服务</Button>}/>
    {!data ? <Loading/> : <div className={styles.cards}>{data.map(service => <Card key={service.id} hoverable className={styles.entity}>
      <div className={styles.entityTop}><Link className={styles.entityLink} href={"/services/" + service.id}><h3>{service.name}</h3><div className={styles.muted}>{service.description}</div></Link><Switch aria-label={service.name + "启停"} checked={enabled[service.id]} onChange={checked => { setEnabled(value => ({ ...value, [service.id]: checked })); message.success(service.name + (checked ? "已启用" : "已停用")); }}/></div>
      <Link href={"/services/" + service.id}><div className={styles.entityMeta}><Tag>{service.type}</Tag><span>{service.capabilities.length} 项能力</span><span>{service.transport}</span><StatusTag value={enabled[service.id] ? "running" : "disabled"}/></div></Link>
    </Card>)}</div>}
  </>;
}

function CapabilityCards({ item }: { item: Service }) {
  return <div className={styles.stack}>{item.capabilities.map(capability => <Card size="small" key={capability.id}><div className={styles.capRow}><span><strong>{capability.name}</strong><br/><small className={styles.muted}>{capability.id} · {capability.description}</small></span><Tag>{capability.risk === "read" ? "只读" : capability.risk === "delete" ? "高危" : "写入"}</Tag></div></Card>)}</div>;
}
function ServiceOverview({ item }: { item: Service }) {
  const facts=[{label:"服务标识",value:<code key="code">{item.code}</code>},{label:"类型",value:item.type},{label:"状态",value:<StatusTag key="status" value={item.status}/>},{label:"连接方式",value:item.transport},{label:"更新时间",value:item.updatedAt}];
  return <div className={styles.detailGrid}><Card title="基本信息"><div className={styles.desktopOnly}><Descriptions column={{ xs: 1, sm: 2 }} items={[
    { key: "code", label: "服务标识", children: item.code }, { key: "type", label: "类型", children: item.type },
    { key: "status", label: "状态", children: <StatusTag value={item.status}/> }, { key: "transport", label: "连接方式", children: item.transport },
    { key: "updated", label: "更新时间", children: item.updatedAt },
  ]}/></div><div className={styles.mobileOnly}><MobileKeyValues items={facts}/></div></Card><Card title="运行控制"><Space direction="vertical" style={{ width: "100%" }}><Switch defaultChecked checkedChildren="已启用" unCheckedChildren="已停用"/><Button block href={"/calls?service=" + item.id}>查看调用记录</Button></Space></Card></div>;
}
function ServiceConnection({ item }: { item: Service }) {
  const [open,setOpen]=useState(false);const definitionLabels={openapi:"从 OpenAPI 导入",manual:"手工配置 REST API",builtin:"使用内置连接器"};const apiFacts=item.type==="API"&&item.apiDefinition?[{label:"API 定义方式",value:definitionLabels[item.apiDefinition.mode]},...(item.apiDefinition.connector==="evernote"?[{label:"内置连接器",value:"印象笔记"},{label:"NoteStore URL",value:<code key="notestore">{item.apiDefinition.noteStoreUrl??"连接验证后自动获取"}</code>}]:[])]:[];const facts=[...apiFacts,{label:"上游连接方式",value:item.transport},{label:"上游认证",value:"已配置（已脱敏）"},{label:"凭证有效期",value:<Tag key="expire" color="warning">2026-08-06 到期</Tag>},{label:"TLS",value:"已启用"}];
  return <><Alert type="info" showIcon message="这里只管理上游连接与认证" description="界面不显示任何密钥；对外认证在端点发布中配置。"/><div className={styles.desktopOnly}><Descriptions className={styles.sectionGap} column={1} bordered items={[
    ...apiFacts.map((fact,index)=>({key:"api-"+index,label:fact.label,children:fact.value})),
    { key: "transport", label: "上游连接方式", children: item.transport }, { key: "auth", label: "上游认证", children: "已配置（已脱敏）" },
    { key: "expire", label: "凭证有效期", children: <Tag color="warning">2026-08-06 到期</Tag> }, { key: "tls", label: "TLS", children: "已启用" },
  ]}/></div><div className={styles.mobileOnly}><MobileKeyValues items={facts}/></div><Button className={styles.sectionGap} type="primary" icon={<KeyOutlined/>} onClick={() => setOpen(true)}>重新配置令牌与有效期</Button><Modal open={open} title="重新配置令牌与有效期" okText="保存配置" cancelText="取消" onCancel={()=>setOpen(false)} onOk={()=>{setOpen(false);message.success("Mock 令牌配置已更新")}}><Form layout="vertical"><Form.Item label="Mock 认证值" required><Input.Password placeholder="仅用于原型演示，请勿填写真实 Secret"/></Form.Item><Form.Item label="凭证到期时间" required><DatePicker showTime style={{width:"100%"}}/></Form.Item></Form></Modal></>;
}
function ServiceTests() { return <Space direction="vertical" style={{ width: "100%" }}><Alert type="success" showIcon message="最近一次模拟测试成功"/><Timeline items={[{ color: "green", children: "18:32 连接测试成功" }, { color: "blue", children: "18:31 保存原始能力结构快照" }]}/><Button type="primary" icon={<ReloadOutlined/>} onClick={()=>message.success("重新测试成功（Mock）")}>重新测试</Button></Space>; }
function LinkedEndpoints({ item }: { item: Service }) {
  return <div className={styles.cards}>{allEndpoints.filter(endpoint => endpoint.serviceIds.includes(item.id)).map(endpoint => <Link key={endpoint.id} href={"/endpoints/" + endpoint.id}><Card hoverable><div className={styles.entityTop}><strong>{endpoint.name}</strong><StatusTag value={endpoint.status}/></div><div className={styles.entityMeta}><Tag>{endpoint.protocol}</Tag><span>{item.capabilities.length} 项能力</span></div></Card></Link>)}</div>;
}
type NavItem = { title: string; summary: string; href: string };
function MobileDetailHome({ title, description, items }: { title: string; description: string; items: NavItem[] }) {
  return <><div className={styles.mobileObject}><h1>{title}</h1><p>{description}</p></div><List className={styles.mobileNavList} dataSource={items} renderItem={item => <List.Item><Link href={item.href} className={styles.mobileNavLink}><span><strong>{item.title}</strong><small>{item.summary}</small></span><RightOutlined/></Link></List.Item>}/></>;
}
function ServiceMobileSection({ item, section }: { item: Service; section?: string }) {
  if (!section) return <MobileDetailHome title={item.name} description={item.description} items={[
    { title: "基本信息", summary: item.type + " · " + statusMap[item.status].text + " · " + item.code, href: `/services/${item.id}/overview` },
    { title: "原始能力", summary: `${item.capabilities.length} 项能力 · ${item.capabilities.filter(x => x.risk === "read").length} 项只读`, href: `/services/${item.id}/capabilities` },
    { title: "连接与认证", summary: item.transport + " · 已配置认证", href: `/services/${item.id}/auth` },
    { title: "测试", summary: "最近测试：今天 18:32 · 成功", href: `/services/${item.id}/tests` },
    { title: "关联端点", summary: allEndpoints.filter(x => x.serviceIds.includes(item.id)).map(x => x.name).join("、") || "暂无关联端点", href: `/services/${item.id}/endpoints` },
    { title: "最近调用", summary: "今日 2 次 · 失败 1 次 · 最近 19:42", href: `/services/${item.id}/calls` },
  ]}/>;
  const content: Record<string, React.ReactNode> = {
    overview: <ServiceOverview item={item}/>, capabilities: <CapabilityCards item={item}/>, auth: <ServiceConnection item={item}/>,
    tests: <ServiceTests/>, endpoints: <LinkedEndpoints item={item}/>, calls: <RecentCalls serviceId={item.id} limit={5}/>,
  };
  return <div className={styles.mobileSection}><h2>{({ overview: "基本信息", capabilities: "原始能力", auth: "连接与认证", tests: "测试", endpoints: "关联端点", calls: "最近调用" } as Record<string, string>)[section] ?? "服务详情"}</h2>{content[section] ?? <Empty/>}</div>;
}
function ServiceDetail({ id, section }: { id: string; section?: string }) {
  const [item, setItem] = useState<Service>(); useEffect(() => { void mockGatewayService.service(id).then(setItem); }, [id]);
  if (!item) return <Loading/>;
  return <><div className={styles.desktopOnly}><Header title={item.name} subtitle={item.description} extra={<StatusTag value={item.status}/>}/><Card className={styles.detailCard}><Tabs tabBarGutter={24} items={[
    { key: "overview", label: "概览", children: <ServiceOverview item={item}/> }, { key: "capabilities", label: "原始能力", children: <CapabilityCards item={item}/> },
    { key: "connection", label: "连接与认证", children: <ServiceConnection item={item}/> }, { key: "test", label: "测试", children: <ServiceTests/> },
    { key: "linked", label: "关联端点", children: <LinkedEndpoints item={item}/> }, { key: "calls", label: "调用记录", children: <RecentCalls serviceId={item.id} limit={5}/> },
  ]}/></Card></div><div className={styles.mobileOnly}><ServiceMobileSection item={item} section={section}/></div></>;
}

function EndpointList() {
  const [data, setData] = useState<Endpoint[] | null>(null); const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => { void mockGatewayService.endpoints().then(items => { setData(items); setEnabled(Object.fromEntries(items.map(item => [item.id, item.status === "running"]))); }); }, []);
  return <><Header title="端点发布" subtitle="组合服务能力并对外发布标准端点" extra={<Button type="primary" icon={<PlusOutlined/>} href="/endpoints/new">新增端点</Button>}/>{!data ? <Loading/> : <div className={styles.cards}>{data.map(endpoint => <Card hoverable className={styles.entity} key={endpoint.id}>
    <div className={styles.entityTop}><Link className={styles.entityLink} href={"/endpoints/" + endpoint.id}><h3>{endpoint.name}</h3><div className={styles.muted}>{endpoint.description}</div></Link><Switch aria-label={endpoint.name + "启停"} checked={enabled[endpoint.id]} onChange={checked => { setEnabled(value => ({ ...value, [endpoint.id]: checked })); message.success(endpoint.name + (checked ? "已启用" : "已停用")); }}/></div>
    <Link href={"/endpoints/" + endpoint.id}><div className={styles.entityMeta}><Tag color="blue">{endpoint.protocol}</Tag><span>{endpoint.serviceIds.length} 个服务</span><span>{endpoint.callers.length} 个调用方</span><span>{endpoint.calls} 次 · {endpoint.successRate}%</span><StatusTag value={enabled[endpoint.id] ? "running" : "disabled"}/></div></Link>
  </Card>)}</div>}</>;
}
function EndpointOverview({ item }: { item: Endpoint }) {
  const facts=[{label:"协议",value:item.protocol},{label:"状态",value:<StatusTag key="status" value={item.status}/>},{label:"端点地址",value:<code key="url">{item.url}</code>},{label:"成功率",value:item.successRate+"%"},{label:"今日调用",value:item.calls+" 次"}];
  return <div className={styles.detailGrid}><Card title="端点信息"><div className={styles.desktopOnly}><Descriptions column={1} bordered items={[
    { key: "protocol", label: "协议", children: item.protocol }, { key: "status", label: "状态", children: <StatusTag value={item.status}/> },
    { key: "url", label: "端点地址", children: <Input readOnly value={item.url}/> }, { key: "rate", label: "成功率", children: item.successRate + "%" },
    { key: "calls", label: "今日调用", children: item.calls + " 次" },
  ]}/></div><div className={styles.mobileOnly}><MobileKeyValues items={facts}/></div></Card><Card title="运行控制"><Space direction="vertical" style={{ width: "100%" }}><Switch defaultChecked checkedChildren="运行中" unCheckedChildren="已停用"/><Button href={"/calls?endpoint=" + item.id} block>查看调用记录</Button></Space></Card></div>;
}
function EndpointSources({ item }: { item: Endpoint }) {
  return <div className={styles.cards}>{item.serviceIds.map(id => { const service = allServices.find(x => x.id === id)!; return <Link href={"/services/" + id} key={id}><Card hoverable><strong>{service.name}</strong><div className={styles.entityMeta}><Tag>{service.type}</Tag><span>{service.capabilities.length} 项原始能力</span></div></Card></Link>; })}</div>;
}
function EndpointConversions({ item }: { item: Endpoint }) {
  return <Space direction="vertical" style={{ width: "100%" }}>{item.serviceIds.map(serviceId => { const service = allServices.find(value => value.id === serviceId)!; return <Collapse key={serviceId} items={[{ key: serviceId, label: <Space><strong>{service.name}</strong><Tag color="blue">{service.type + " → " + item.protocol}</Tag></Space>, children: service.capabilities.slice(0, 3).map(capability => <Card size="small" key={capability.id} className={styles.sectionGap}><strong>{capability.name}</strong><div className={styles.keyValues}><span>原始能力</span><code>{capability.id}</code><span>对外能力</span><code>{item.protocol === "MCP" ? capability.id.replace(/-/g, "_") : "/" + capability.id.replace(/-/g, "/")}</code><span>状态</span><StatusTag value="running"/></div></Card>) }]}/>; })}</Space>;
}
function PermissionSummary({ serviceIds }: { serviceIds: string[] }) {
  return <Space direction="vertical" style={{ width: "100%" }}>{serviceIds.map(id => { const service = allServices.find(item => item.id === id)!; return <Collapse key={id} items={[{ key: id, label: <strong>{service.name}</strong>, children: service.capabilities.map(capability => <div className={styles.envRow} key={capability.id}><span>{capability.name}</span><Tag color={capability.permission === "allow" ? "success" : capability.permission === "deny" ? "error" : "warning"}>{capability.permission === "allow" ? "允许" : capability.permission === "deny" ? "禁止" : "每次确认"}</Tag></div>) }]}/>; })}</Space>;
}
function EndpointAuth({ item }: { item: Endpoint }) {
  return <Space direction="vertical" style={{ width: "100%" }}><Alert type="info" showIcon message={item.protocol === "MCP" ? "下游 OAuth 2.1 已配置" : "下游 API Key 已配置"} description="令牌只展示摘要，不显示完整值。"/><Descriptions bordered column={1} items={[{ key: "expire", label: "令牌有效期", children: "2026-10-30 23:59" }, { key: "remaining", label: "剩余时间", children: <Tag color="success">90 天</Tag> }]}/><Button type="primary" icon={<ReloadOutlined/>} onClick={() => Modal.confirm({ title: "重新生成令牌？", content: "旧令牌将立即失效，所有调用方需要更新配置。", okText: "重新生成", onOk: () => message.success("已生成新的模拟令牌") })}>重新生成令牌</Button></Space>;
}
function EndpointCallers({ item }: { item: Endpoint }) {
  return <div className={styles.cards}>{item.callers.map(caller => <Card key={caller.id}><div className={styles.entityTop}><strong>{caller.name}</strong><StatusTag value={caller.status}/></div><p className={styles.muted}>{caller.auth}</p><Space wrap><Button>独立授权</Button><Button href={"/calls?client=" + caller.id}>查看日志</Button></Space></Card>)}</div>;
}
function EndpointMobileSection({ item, section }: { item: Endpoint; section?: string }) {
  if (!section) return <MobileDetailHome title={item.name} description={item.description} items={[
    { title: "端点概览", summary: `${item.protocol} · ${item.serviceIds.length} 个服务 · ${item.serviceIds.reduce((sum, id) => sum + (allServices.find(x => x.id === id)?.capabilities.length ?? 0), 0)} 项能力`, href: `/endpoints/${item.id}/overview` },
    { title: "来源服务", summary: item.serviceIds.map(serviceName).join("、"), href: `/endpoints/${item.id}/services` },
    { title: "能力与转换", summary: `${item.serviceIds.length} 类转换 · API、邮箱、MCP 统一发布`, href: `/endpoints/${item.id}/capabilities` },
    { title: "权限策略", summary: "允许 6 · 每次确认 3 · 禁止 2", href: `/endpoints/${item.id}/permissions` },
    { title: "认证", summary: item.protocol === "MCP" ? "OAuth 2.1 · 90 天有效" : "API Key · 90 天有效", href: `/endpoints/${item.id}/auth` },
    { title: "调用方", summary: `${item.callers.length} 个 · ${item.callers.map(x => x.name).join("、")}`, href: `/endpoints/${item.id}/callers` },
    { title: "最近调用", summary: `今日 ${item.calls} 次 · 最近 19:42`, href: `/endpoints/${item.id}/calls` },
  ]}/>;
  const content: Record<string, React.ReactNode> = {
    overview: <EndpointOverview item={item}/>, services: <EndpointSources item={item}/>, capabilities: <EndpointConversions item={item}/>,
    permissions: <PermissionSummary serviceIds={item.serviceIds}/>, auth: <EndpointAuth item={item}/>, callers: <EndpointCallers item={item}/>,
    calls: <RecentCalls endpointId={item.id} limit={5}/>,
  };
  return <div className={styles.mobileSection}><h2>{({ overview: "端点概览", services: "来源服务", capabilities: "能力与转换", permissions: "权限策略", auth: "认证", callers: "调用方", calls: "最近调用" } as Record<string, string>)[section] ?? "端点详情"}</h2>{content[section] ?? <Empty/>}</div>;
}
function EndpointDetail({ id, section }: { id: string; section?: string }) {
  const [item, setItem] = useState<Endpoint>(); useEffect(() => { void mockGatewayService.endpoint(id).then(setItem); }, [id]);
  if (!item) return <Loading/>;
  return <><div className={styles.desktopOnly}><Header title={item.name} subtitle={item.description} extra={<StatusTag value={item.status}/>}/><Card className={styles.detailCard}><Tabs items={[
    { key: "overview", label: "概览", children: <EndpointOverview item={item}/> }, { key: "sources", label: "来源服务", children: <EndpointSources item={item}/> },
    { key: "conversion", label: "能力与转换", children: <EndpointConversions item={item}/> }, { key: "permission", label: "权限", children: <PermissionSummary serviceIds={item.serviceIds}/> },
    { key: "auth", label: "认证", children: <EndpointAuth item={item}/> }, { key: "callers", label: "调用方", children: <EndpointCallers item={item}/> },
    { key: "calls", label: "调用记录", children: <RecentCalls endpointId={item.id} limit={5}/> },
  ]}/></Card></div><div className={styles.mobileOnly}><EndpointMobileSection item={item} section={section}/></div></>;
}

const callColumns = [
  { title: "时间", dataIndex: "time", width: 170 }, { title: "调用方", dataIndex: "client", width: 120 },
  { title: "端点", key: "endpoint", width: 190, render: (_: unknown, row: Call) => <Button type="link" href={"/calls?endpoint=" + row.endpointId}>{endpointName(row.endpointId)}</Button> },
  { title: "服务", key: "service", width: 130, render: (_: unknown, row: Call) => <Button type="link" href={"/calls?service=" + row.serviceId}>{serviceName(row.serviceId)}</Button> },
  { title: "能力", key: "cap", width: 130, render: (_: unknown, row: Call) => capabilityName(row.serviceId, row.capabilityId) },
  { title: "转换类型", dataIndex: "conversionType", width: 120 },
  { title: "结果", dataIndex: "result", width: 90, render: (value: string) => <Tag color={value === "success" ? "success" : "error"}>{value === "success" ? "成功" : "失败"}</Tag> },
  { title: "耗时", dataIndex: "duration", width: 100, render: (value: number) => value + " 毫秒" },
  { title: "请求编号", dataIndex: "id", width: 120, render: (value: string) => <Link href={"/calls/" + value}>{value}</Link> },
];
function MobileCallCards({ data }: { data: Call[] }) {
  return <div className={styles.callCards}>{data.map(item => <Link href={"/calls/" + item.id} key={item.id}><Card size="small"><div className={styles.entityTop}><strong>{capabilityName(item.serviceId, item.capabilityId)}</strong><Tag color={item.result === "success" ? "success" : "error"}>{item.result === "success" ? "成功" : "失败"}</Tag></div><div className={styles.callRoute}>{item.client} → {endpointName(item.endpointId)}</div><div className={styles.callService}>{serviceName(item.serviceId)}</div><div className={styles.callMeta}>{item.time.slice(11)} · {item.duration} 毫秒</div></Card></Link>)}</div>;
}
function RecentCalls({ limit = 5, serviceId, endpointId }: { limit?: number; serviceId?: string; endpointId?: string }) {
  const data = allCalls.filter(item => (!serviceId || item.serviceId === serviceId) && (!endpointId || item.endpointId === endpointId)).slice(0, limit);
  return data.length ? <><div className={styles.desktopOnly}><Table rowKey="id" size="small" pagination={false} dataSource={data} columns={callColumns} scroll={{ x: 1150 }}/></div><div className={styles.mobileOnly}><MobileCallCards data={data}/></div></> : <Empty description="暂无调用记录"/>;
}
type CallFilters = { time: string; client: string; endpoint: string; service: string; result: string; keyword: string };
function FilterFields({ filters, setFilters, compact = false }: { filters: CallFilters; setFilters: React.Dispatch<React.SetStateAction<CallFilters>>; compact?: boolean }) {
  const update = (key: keyof CallFilters, value?: string) => setFilters(item => ({ ...item, [key]: value ?? "" }));
  return <div className={compact ? styles.callFilterBar : styles.filterStack}>
    <Select aria-label="时间范围" value={filters.time} onChange={value => update("time", value)} options={[{ label: "今天", value: "today" }, { label: "最近 24 小时", value: "24h" }, { label: "最近 7 天", value: "7d" }, { label: "自定义", value: "custom" }]}/>
    {filters.time === "custom" ? <DatePicker.RangePicker aria-label="自定义时间范围"/> : null}
    <Select aria-label="调用方" allowClear placeholder="调用方" value={filters.client || undefined} onChange={value => update("client", value)} options={[...new Set(allCalls.map(x => x.client))].map(value => ({ label: value, value }))}/>
    <Select aria-label="端点" allowClear placeholder="端点" value={filters.endpoint || undefined} onChange={value => update("endpoint", value)} options={allEndpoints.map(item => ({ label: item.name, value: item.id }))}/>
    <Select aria-label="服务" allowClear placeholder="服务" value={filters.service || undefined} onChange={value => update("service", value)} options={allServices.map(item => ({ label: item.name, value: item.id }))}/>
    <Select aria-label="调用结果" allowClear placeholder="结果" value={filters.result || undefined} onChange={value => update("result", value)} options={[{ label: "成功", value: "success" }, { label: "失败", value: "failed" }]}/>
    <Input.Search aria-label="关键词" placeholder="能力、调用方或请求编号" value={filters.keyword} onChange={event => update("keyword", event.target.value)}/>
  </div>;
}
function CallList() {
  const emptyFilters: CallFilters = { time: "today", client: "", endpoint: "", service: "", result: "", keyword: "" };
  const [data, setData] = useState<Call[] | null>(null); const [drawer, setDrawer] = useState(false); const [filters, setFilters] = useState<CallFilters>(emptyFilters);
  useEffect(() => { const query = new URLSearchParams(window.location.search); queueMicrotask(() => setFilters(value => ({ ...value, client: query.get("client") ?? "", endpoint: query.get("endpoint") ?? "", service: query.get("service") ?? "", result: query.get("result") ?? "" }))); void mockGatewayService.calls().then(setData); }, []);
  const shown = useMemo(() => data?.filter(item => (!filters.client || item.client === filters.client) && (!filters.endpoint || item.endpointId === filters.endpoint) && (!filters.service || item.serviceId === filters.service) && (!filters.result || item.result === filters.result) && (!filters.keyword || (item.id + item.client + capabilityName(item.serviceId, item.capabilityId)).toLowerCase().includes(filters.keyword.toLowerCase()))) ?? [], [data, filters]);
  const activeCount = [filters.client, filters.endpoint, filters.service, filters.result, filters.keyword, filters.time !== "today" ? filters.time : ""].filter(Boolean).length;
  return <><div className={styles.callsHeader}><div><h1>调用记录</h1><span>共 {shown.length} 条 · 失败 {shown.filter(x => x.result === "failed").length} 条</span></div><Badge count={activeCount} size="small"><Button icon={<FilterOutlined/>} onClick={() => setDrawer(true)}>筛选</Button></Badge></div>
    <div className={styles.desktopOnly}><Card><FilterFields compact filters={filters} setFilters={setFilters}/><div className={styles.filterActions}><Button type="primary">查询</Button><Button onClick={() => setFilters(emptyFilters)}>重置</Button></div><Table rowKey="id" dataSource={shown} columns={callColumns} scroll={{ x: 1200 }} pagination={{ total: shown.length, current: 1, pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: total => `共 ${total} 条` }}/></Card></div>
    <div className={styles.mobileOnly}>{!data ? <Skeleton active/> : <MobileCallCards data={shown}/>}</div>
    <Drawer open={drawer} title="筛选调用记录" placement="bottom" height="min(86dvh, 680px)" onClose={() => setDrawer(false)} footer={<div className={styles.drawerActions}><Button onClick={() => setFilters(emptyFilters)}>重置</Button><Button type="primary" onClick={() => setDrawer(false)}>应用筛选</Button></div>}><FilterFields filters={filters} setFilters={setFilters}/></Drawer>
  </>;
}
function CallDetail({ id }: { id: string }) {
  const item = allCalls.find(value => value.id === id); if (!item) return <Card><Empty description="调用记录不存在"/></Card>;
  const chain = [["调用方", item.client], ["端点", endpointName(item.endpointId)], ["服务", serviceName(item.serviceId)], ["能力", capabilityName(item.serviceId, item.capabilityId)], ["结果", item.result === "success" ? "成功" : "失败"]];
  const info = [{ key: "id", label: "请求编号", children: item.id }, { key: "time", label: "调用时间", children: item.time }, { key: "client", label: "调用方", children: item.client }, { key: "endpoint", label: "端点", children: endpointName(item.endpointId) }, { key: "service", label: "服务", children: serviceName(item.serviceId) }, { key: "cap", label: "能力", children: capabilityName(item.serviceId, item.capabilityId) }, { key: "conversion", label: "转换类型", children: item.conversionType }, { key: "result", label: "结果", children: item.result === "success" ? "成功" : "失败" }, { key: "duration", label: "总耗时", children: item.duration + " 毫秒" }];
  return <><Header title="调用详情" subtitle={item.id} extra={<Tag color={item.result === "success" ? "success" : "error"}>{item.result === "success" ? "成功" : "失败"}</Tag>}/><div className={styles.detailGrid}>
    <Card title="基本信息"><Descriptions column={1} items={info}/></Card>
    <Card title="调用链"><div className={styles.desktopOnly}><div className={styles.flow}>{chain.map(([name, value]) => <span key={name} className={styles.flowNode}>{name}<br/><strong>{value}</strong></span>)}</div></div><div className={styles.mobileOnly}><Timeline items={chain.map(([name, value], index) => ({ color: index === chain.length - 1 ? (item.result === "success" ? "green" : "red") : "blue", children: <><strong>{name}</strong><br/>{value}</> }))}/></div></Card>
    <Card title="请求与响应" className={styles.full}><Descriptions column={1} items={[{ key: "input", label: "脱敏输入参数", children: '{"query":"项目资料","token":"***"}' }, { key: "request", label: "脱敏请求摘要", children: "按关键词搜索，最多返回 20 条" }, { key: "response", label: "脱敏响应摘要", children: item.message }, { key: "error", label: "上游错误摘要", children: item.upstreamError }, { key: "stages", label: "各阶段耗时", children: "鉴权 18ms · 策略 9ms · 上游 271ms · 脱敏 26ms" }]}/></Card>
  </div></>;
}

function Settings() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const confirmClear = () => Modal.confirm({ title: "确认清空调用记录？", content: "此操作不可撤销。当前为模拟数据，不会删除真实数据。", okText: "清空", okButtonProps: { danger: true } });
  return <><Header title="设置" subtitle="运行控制、数据、系统状态、身份认证与通知"/><div className={styles.settingsStack}>
    <Card title="运行控制"><Space wrap><Tag color="success">运行中</Tag><Button onClick={() => Modal.confirm({ title: "确认暂停网关？", content: "暂停后所有调用将被阻断。", okText: "确认暂停" })}>暂停</Button><Button type="primary" disabled>恢复</Button></Space></Card>
    <Card title="数据"><div className={styles.dataSettings}><Form.Item label="调用记录保留"><Radio.Group defaultValue={90} options={[30, 90, 180].map(value => ({ label: value + " 天", value }))}/></Form.Item><Button danger icon={<DeleteOutlined/>} onClick={confirmClear}>清空记录</Button></div></Card>
    <Card title="系统状态"><Descriptions column={{ xs: 1, sm: 2 }} bordered items={[["Supabase", "正常"], ["Upstash", "正常"], ["Resend", "正常"], ["Vercel", "正常"], ["版本号", "v0.3.0-prototype"], ["部署时间", "2026-08-01"]].map(([name, value]) => ({ key: name, label: name, children: value === "正常" ? <StatusTag value="running"/> : value }))}/></Card>
    <Card title="身份认证"><Descriptions column={1} items={[{ key: "provider", label: "认证服务", children: "Supabase Auth" }, { key: "password", label: "密码登录", children: <Tag color="success">可用</Tag> }, { key: "passkey", label: "Passkey", children: <Tag>即将支持</Tag> }]}/><Button icon={<KeyOutlined/>} onClick={() => setPasswordOpen(true)}>修改密码</Button></Card>
    <Card title="通知设置"><Form layout="vertical" className={styles.notificationForm}><Form.Item label="接收邮箱"><Input prefix={<MailOutlined/>} defaultValue="notify@example.com"/></Form.Item><div className={styles.settingRow}><div><strong>到期通知</strong><div className={styles.muted}>凭证或令牌临近到期时通知</div></div><Switch defaultChecked/></div><Form.Item label="提前通知天数"><InputNumber min={1} max={90} defaultValue={7} addonAfter="天"/></Form.Item><div className={styles.settingRow}><div><strong>非常用时段端点调用通知</strong><div className={styles.muted}>在设定时段发生调用时通知</div></div><Switch defaultChecked/></div><Form.Item label="非常用时段"><TimePicker.RangePicker format="HH:mm" placeholder={["开始时间", "结束时间"]}/></Form.Item><div className={styles.settingRow}><div><strong>高危能力调用通知</strong><div className={styles.muted}>高危能力被调用或确认时通知</div></div><Switch defaultChecked/></div><Form.Item label="高危能力定义"><Select mode="multiple" defaultValue={["删除", "发送", "上传", "下载附件"]} options={["删除", "发送", "上传", "下载附件", "转账", "下单"].map(value => ({ label: value, value }))}/></Form.Item><Button type="primary" icon={<ApiOutlined/>}>发送测试通知</Button></Form></Card>
  </div><Modal open={passwordOpen} title="修改密码" okText="确认修改" cancelText="取消" onCancel={() => setPasswordOpen(false)} onOk={() => setPasswordOpen(false)}><Form layout="vertical"><Form.Item label="当前密码" required><Input.Password/></Form.Item><Form.Item label="新密码" required><Input.Password/></Form.Item><Form.Item label="确认新密码" required><Input.Password/></Form.Item></Form></Modal></>;
}
