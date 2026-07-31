"use client";

import { FilterOutlined, KeyOutlined, PlusOutlined, PoweroffOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Checkbox, Col, Descriptions, Divider, Form, Input, InputNumber, Modal, Progress, Radio, Row, Select, Space, Steps, Switch, Tag, Timeline, Typography, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { mockGatewayService } from "@/services/mock/gateway-service";
import type { AuditLog, GatewayEntity } from "@/services/contracts/gateway";
import { CodePreview, ConfirmAction, ConnectionHealth, CopyableEndpoint, EmptyState, EntityStatusTag, FilterDrawer, LoadingState, PageHeader, ResponsiveDataView, ResponsiveDrawer, RiskBadge, SecretField, WarningBanner, sharedStyles as styles } from "./Shared";

const sectionMeta: Record<string, { title: string; subtitle: string; create?: string }> = {
  tools: { title: "工具", subtitle: "协议中立的 AI 可调用能力，由通用 Executor 执行", create: "/tools/new-rest" },
  connections: { title: "连接", subtitle: "外部账号或服务实例；上游凭证不会暴露给 AI", create: "/connections/new" },
  publications: { title: "Publication", subtitle: "将同一组 Tool 动态发布为 MCP 或 OpenAPI", create: "/publications/new" },
  clients: { title: "AI 客户端", subtitle: "登记调用方、认证方式、状态与调用限额", create: "/clients/new" },
  grants: { title: "授权关系", subtitle: "默认拒绝，按 Publication、Tool 与 Scope 精细授权" },
  "security-events": { title: "安全事件", subtitle: "越权、凭证异常、连续失败与总闸变更" },
  alerts: { title: "告警与通知", subtitle: "固定规则、Resend 配置与脱敏通知测试" },
};

function sectionFrom(path: string) { return path.split("/").filter(Boolean)[0] || "dashboard"; }
function detailId(path: string) { return path.split("/").filter(Boolean)[1]; }

export function AdminPage({ path }: { path: string }) {
  const section = sectionFrom(path);
  if (section === "dashboard") return <Dashboard />;
  if (section === "logs") return <Logs id={detailId(path)} />;
  if (section === "settings") return <Settings />;
  if (["new-rest", "import-openapi", "import-mcp"].includes(detailId(path) ?? "")) return <ToolFlow mode={detailId(path)!} />;
  if (detailId(path) === "new") return <CreateFlow section={section} />;
  if (detailId(path)) return <EntityDetail section={section} id={detailId(path)!} />;
  return <EntityList section={section} />;
}

function Dashboard() {
  const metrics = [["工具", "5", "/tools"], ["连接", "6", "/connections"], ["Publication", "2", "/publications"], ["AI 客户端", "3", "/clients"], ["今日调用", "148", "/logs"], ["调用失败", "4", "/logs"], ["安全事件", "3", "/security-events"], ["即将到期", "1", "/connections"]] as const;
  return <>
    <PageHeader title="运行概览" subtitle="工具、授权、调用与安全状态的统一视图" extra={<Space><Button icon={<FilterOutlined />}>时间范围</Button><Button type="primary" icon={<PlusOutlined />} href="/tools/new-rest">注册 Tool</Button></Space>} />
    <WarningBanner>“我的百度网盘”凭证将在 5 天后到期；建议及时更新，避免 Publication 调用失败。</WarningBanner>
    <div className={styles.grid}>{metrics.map(([label, value, href]) => <Link href={href} key={label}><Card hoverable><div className={styles.metricLabel}>{label}</div><div className={styles.metricValue}>{value}</div></Card></Link>)}</div>
    <Divider />
    <Row gutter={[16,16]}>
      <Col xs={24} lg={15}><Card title="统一执行链"><div className={styles.flow}>{["AI Client", "Grant", "Publication", "Tool", "Connection + Executor"].map((x, i) => <div className={styles.flowStep} key={x}><Tag color={i === 4 ? "purple" : "blue"}>{i + 1}</Tag><div style={{ marginTop: 8, fontWeight: 600 }}>{x}</div></div>)}</div><Alert style={{ marginTop: 16 }} type="info" showIcon message="REST Tool 只配置一次，可同时加入 MCP 和 OpenAPI Publication；系统通过通用 Executor 执行。" /></Card></Col>
      <Col xs={24} lg={9}><Card title="连接健康"><Space direction="vertical" size={14} style={{ width: "100%" }}><ConnectionHealth status="normal" /><Progress percent={83} status="active" /><Typography.Text type="secondary">5 个健康 · 1 个需关注</Typography.Text><Button href="/connections" block>查看全部连接</Button></Space></Card></Col>
      <Col xs={24} lg={15}><Card title="最近调用"><Timeline items={[{ color: "green", children: "17:38 ChatGPT MCP · 搜索邮件 · 成功" }, { color: "orange", children: "17:31 私人 GPT · 搜索网盘 · 上游失败" }, { color: "red", children: "17:22 私人 GPT · 未授权 Tool · 已拒绝" }]} /><Button href="/logs">查看调用日志</Button></Card></Col>
      <Col xs={24} lg={9}><Card title="紧急控制" extra={<Tag color="success">调用已启用</Tag>}><p>总闸会立即阻断所有 AI 调用，但不影响管理后台。</p><ConfirmAction title="确认触发全局紧急停止？此操作会中断所有 Publication。" onConfirm={() => window.alert("模拟：全局 Kill Switch 已触发")}>触发紧急停止</ConfirmAction></Card></Col>
    </Row>
  </>;
}

function EntityList({ section }: { section: string }) {
  const meta = sectionMeta[section] ?? { title: section, subtitle: "管理列表" };
  const [items, setItems] = useState<GatewayEntity[] | null>(null);
  const [selected, setSelected] = useState<GatewayEntity>();
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { void mockGatewayService.list(section).then(setItems); }, [section]);
  const extras = <Space wrap>{section === "tools" ? <><Button href="/tools/import-openapi">导入 OpenAPI</Button><Button href="/tools/import-mcp">注册远程 MCP</Button></> : null}<Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>筛选</Button>{meta.create ? <Button type="primary" icon={<PlusOutlined />} href={meta.create}>新建</Button> : null}</Space>;
  return <>
    <PageHeader title={meta.title} subtitle={meta.subtitle} extra={extras} />
    {section === "alerts" ? <ResendPanel /> : null}
    {items === null ? <LoadingState /> : items.length ? <ResponsiveDataView items={items} onOpen={setSelected} /> : <EmptyState text={`暂无${meta.title}`} />}
    <ResponsiveDrawer open={Boolean(selected)} onClose={() => setSelected(undefined)} title={selected?.name ?? "详情"}>{selected ? <><Descriptions column={1} bordered size="small" items={[{ key: "type", label: "类型", children: selected.kind }, { key: "status", label: "状态", children: <EntityStatusTag status={selected.status} /> }, { key: "risk", label: "风险", children: <RiskBadge risk={selected.risk} /> }, { key: "desc", label: "说明", children: selected.description }, { key: "meta", label: "配置摘要", children: selected.meta }]} /><Divider /><Button type="primary" href={`/${section}/${selected.id}`}>打开完整详情</Button></> : null}</ResponsiveDrawer>
    <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} title={`${meta.title}筛选`}><Form layout="vertical"><Form.Item label="状态"><Select mode="multiple" options={["正常","需关注","异常","草稿","已停用"].map((x) => ({ value: x, label: x }))} /></Form.Item><Form.Item label="类型"><Select options={["REST","IMAP","Remote MCP","OpenAPI","MCP"].map((x) => ({ value: x, label: x }))} /></Form.Item><Button type="primary" block onClick={() => setFilterOpen(false)}>应用筛选</Button></Form></FilterDrawer>
  </>;
}

function EntityDetail({ section, id }: { section: string; id: string }) {
  const [item, setItem] = useState<GatewayEntity>();
  const [keyOpen, setKeyOpen] = useState(false);
  useEffect(() => { void mockGatewayService.get(section, id).then(setItem); }, [section, id]);
  if (!item) return <LoadingState />;
  return <>
    <PageHeader title={item.name} subtitle={item.description} extra={<Space><Button>编辑</Button><Button type="primary" onClick={() => setKeyOpen(true)} icon={<KeyOutlined />}>{section === "clients" ? "创建 API Key" : "测试"}</Button></Space>} />
    {item.status === "warning" ? <WarningBanner>{item.meta}</WarningBanner> : null}
    <div className={styles.detailGrid}>
      <Card title="基本信息"><Descriptions column={{ xs: 1, sm: 2 }} bordered items={[{ key: "id", label: "稳定 ID", children: item.id }, { key: "kind", label: "类型", children: item.kind }, { key: "status", label: "状态", children: <EntityStatusTag status={item.status} /> }, { key: "risk", label: "风险", children: <RiskBadge risk={item.risk} /> }, { key: "meta", label: "配置摘要", children: item.meta, span: 2 }, { key: "updated", label: "更新时间", children: item.updatedAt }]} /></Card>
      <Card title="实时控制"><Space direction="vertical" style={{ width: "100%" }}><Switch defaultChecked checkedChildren="已启用" unCheckedChildren="已停用" /><Button block>查看关联日志</Button><ConfirmAction title={`确认停用 ${item.name}？`} onConfirm={() => window.alert("模拟：对象已停用")}>停用对象</ConfirmAction></Space></Card>
      <Card title="执行与发布关系"><div className={styles.flow}>{["AI Client", "Grant", "Publication", "Tool", "Connection + Executor"].map((x, i) => <div className={styles.flowStep} key={x}><Tag>{i + 1}</Tag> {x}</div>)}</div></Card>
      <Card title="安全配置"><SecretField /><Divider /><CopyableEndpoint value={section === "publications" ? `https://gateway.example/api/${item.kind.toLowerCase()}/${item.id}` : `entity://${section}/${item.id}`} /></Card>
    </div>
    <Modal open={keyOpen} onCancel={() => setKeyOpen(false)} onOk={() => setKeyOpen(false)} title={section === "clients" ? "API Key 已创建（仅显示一次）" : "Mock 测试成功"} okText="我已保存"><Alert type="success" showIcon message={section === "clients" ? "pg_live_A9f3K2x7M8q1Z5r4" : "连接与 Schema 校验通过"} /><p>关闭后系统只保留哈希与前缀，无法再次查看完整值。</p></Modal>
  </>;
}

function ToolFlow({ mode }: { mode: string }) {
  const meta = mode === "new-rest" ? ["新增 REST Tool", "基本信息", "Connection", "参数映射", "Schema", "风险", "测试", "保存"] : mode === "import-openapi" ? ["导入 OpenAPI", "文档", "模拟解析", "选择 Operation", "批量调整", "导入 Tool"] : ["注册远程 MCP", "地址与认证", "连接测试", "发现 Tool", "选择导入", "完成"];
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const steps = meta.slice(1);

  const moveTo = (next: number) => {
    setCurrent(next);
    window.requestAnimationFrame(() => document.querySelector("[data-testid='wizard-card']")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return <>
    <PageHeader title={meta[0]} subtitle="Mock 流程不会连接真实账号或保存真实密钥" />
    <div className={styles.wizard} data-testid="wizard-card">
      <Card><Steps current={current} responsive size="small" items={steps.map((title) => ({ title }))} /><Divider />
        {done ? <Alert type="success" showIcon message="流程已完成，已生成 Tool 草稿" description="原型中数据不会持久化；正式版将通过 Mock Service 契约替换为真实 API。" /> : <>
          <Typography.Title level={5} className={styles.stepTitle} data-testid="wizard-step-title">当前步骤：{steps[current]}</Typography.Title>
          <FlowStep mode={mode} step={current} />
        </>}
        <div className={styles.stickyActions} data-testid="wizard-actions">
          <Button disabled={current === 0 || done} onClick={() => moveTo(current - 1)}>上一步</Button>
          <Button type="primary" disabled={done} onClick={() => current === steps.length - 1 ? setDone(true) : moveTo(current + 1)}>{current === steps.length - 1 ? "保存" : "下一步"}</Button>
        </div>
      </Card>
    </div>
  </>;
}

function FlowStep({ mode, step }: { mode: string; step: number }) {
  if (mode === "new-rest") {
    if (step === 0) return <Form layout="vertical" className={styles.formGrid}><Form.Item label="Tool 显示名称" required><Input defaultValue="查询公共行情" /></Form.Item><Form.Item label="稳定唯一名称" required><Input defaultValue="market_ticker" /></Form.Item></Form>;
    if (step === 1) return <Form layout="vertical"><Form.Item label="Connection"><Select defaultValue="binance" options={[{ value: "binance", label: "币安公共行情 REST" }, { value: "baidu", label: "我的百度网盘" }]} /></Form.Item><Alert type="info" showIcon message="凭证由 Connection 管理，不会写入 Tool 或暴露给 AI 客户端。" /></Form>;
    if (step === 2) return <Form layout="vertical" className={styles.formGrid}><Form.Item label="HTTP 方法"><Select defaultValue="GET" options={["GET","POST","PUT"].map((x) => ({ value: x, label: x }))} /></Form.Item><Form.Item label="路径模板"><Input defaultValue="/api/v3/ticker/price" /></Form.Item><Form.Item label="参数映射" className={styles.full}><Input.TextArea rows={4} defaultValue={'{"symbol":"query.symbol"}'} /></Form.Item></Form>;
    if (step === 3) return <Form layout="vertical"><Form.Item label="输入 Schema"><Input.TextArea rows={7} defaultValue={'{"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}'} /></Form.Item></Form>;
    if (step === 4) return <Form layout="vertical"><Form.Item label="只读与风险"><Space wrap><Switch defaultChecked /> 只读 <RiskBadge risk="low" /></Space></Form.Item><Alert type="success" showIcon message="该 Tool 仅执行公开行情查询，判定为低风险。" /></Form>;
    if (step === 5) return <Form layout="vertical"><Form.Item label="测试参数"><Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} defaultValue='{"symbol":"BTCUSDT"}' /></Form.Item><Alert type="success" showIcon message="Mock 测试通过：HTTP 200，Schema 校验成功。" /></Form>;
    return <Alert type="info" showIcon message="配置检查完成" description="保存后将生成 REST Tool 草稿，可加入 MCP 或 OpenAPI Publication。" />;
  }
  if (mode === "import-openapi") {
    if (step === 0) return <Form layout="vertical"><Form.Item label="OpenAPI URL 或文档"><Input defaultValue="https://example.test/openapi.json" /></Form.Item></Form>;
    if (step === 1) return <Alert type="warning" showIcon message="已模拟解析 8 个 Operation" description="默认排除 deleteFile、sendMail、createOrder 三个高风险接口。" />;
    if (step === 2) return <Checkbox.Group defaultValue={["searchFiles","getFileMeta","listFolders"]} options={["searchFiles","getFileMeta","listFolders","deleteFile（高风险，默认排除）","sendMail（V1 禁止）"]} />;
    if (step === 3) return <Form layout="vertical"><Form.Item label="批量风险级别"><Select defaultValue="low" options={[{ value: "low", label: "低风险 / 只读" }, { value: "medium", label: "中风险" }]} /></Form.Item></Form>;
    return <Alert type="info" showIcon message="将导入 3 个只读 Tool" />;
  }
  if (step === 0) return <Form layout="vertical"><Form.Item label="远程 MCP URL"><Input defaultValue="https://mcp.example.test/mcp" /></Form.Item><Form.Item label="传输方式"><Radio.Group defaultValue="http"><Radio value="http">Streamable HTTP</Radio><Radio value="sse">SSE</Radio></Radio.Group></Form.Item></Form>;
  if (step === 1) return <Alert type="success" showIcon message="Mock 连接测试成功" description="端点可访问，initialize 与 tools/list 均正常。" />;
  if (step === 2) return <Alert type="info" showIcon message="发现 4 个 Tool" />;
  if (step === 3) return <Checkbox.Group defaultValue={["weather_lookup","forecast_daily"]} options={["weather_lookup","forecast_daily","geocode","admin_delete_cache（高风险，默认排除）"]} />;
  return <Alert type="info" showIcon message="将导入 2 个远程 MCP Tool" />;
}

function CreateFlow({ section }: { section: string }) {
  const labels: Record<string, string> = { connections: "新增连接", publications: "创建 Publication", clients: "注册 AI Client" };
  const [saved, setSaved] = useState(false);
  return <><PageHeader title={labels[section] ?? "新建"} subtitle="配置驱动的 Mock 创建流程" /><Card>{saved ? <Alert type="success" showIcon message="已保存 Mock 配置" /> : <Form layout="vertical" className={styles.formGrid} onFinish={() => setSaved(true)}><Form.Item label="名称" required><Input placeholder="输入名称" /></Form.Item><Form.Item label="类型"><Select defaultValue={section === "publications" ? "MCP" : section === "clients" ? "ChatGPT MCP" : "REST"} options={["MCP","OpenAPI","REST","IMAP","Remote MCP","ChatGPT MCP","GPT Action"].map((x) => ({ value: x, label: x }))} /></Form.Item>{section === "publications" ? <><Form.Item label="选择 Tool" className={styles.full}><Select mode="multiple" defaultValue={["mail_search_messages","files_search"]} options={["mail_search_messages","files_search","notes_search","market_ticker"].map((x) => ({ value: x, label: x }))} /></Form.Item><Form.Item label="Scope"><Select mode="tags" defaultValue={["mail.read","files.read"]} /></Form.Item><Form.Item label="每分钟限流"><InputNumber min={1} defaultValue={30} style={{ width: "100%" }} /></Form.Item></> : null}<Form.Item label="认证方式"><Select defaultValue="oauth" options={[{ value: "oauth", label: "OAuth 2.1" }, { value: "key", label: "Bearer API Key" }]} /></Form.Item><Form.Item label="状态"><Switch defaultChecked checkedChildren="启用" unCheckedChildren="停用" /></Form.Item><Form.Item className={styles.full}><Button htmlType="submit" type="primary">保存并启用</Button></Form.Item></Form>}</Card></>;
}

function Logs({ id }: { id?: string }) {
  const [logs, setLogs] = useState<AuditLog[] | null>(null); const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { void mockGatewayService.logs().then(setLogs); }, []);
  const selected = useMemo(() => logs?.find((x) => x.id === id), [logs, id]);
  if (id && selected) return <><PageHeader title={`调用详情 ${selected.id}`} subtitle={`${selected.client} → ${selected.tool}`} /><Card><Descriptions bordered column={{ xs: 1, sm: 2 }} items={[{ key: "client", label: "AI Client", children: selected.client }, { key: "tool", label: "Tool", children: selected.tool }, { key: "connection", label: "Connection", children: selected.connection }, { key: "risk", label: "风险", children: <RiskBadge risk={selected.risk} /> }, { key: "duration", label: "耗时", children: `${selected.duration} ms` }, { key: "result", label: "结果", children: selected.result }]} /><Divider /><CodePreview value={JSON.stringify({ request_id: selected.id, input: "[REDACTED]", credential: "[NEVER LOGGED]", result: selected.description }, null, 2)} /></Card></>;
  const entities = logs?.map((log) => ({ ...log, meta: `${log.client} · ${log.tool} · ${log.duration}ms` })) ?? [];
  return <><PageHeader title="调用日志" subtitle="只记录脱敏元数据，不记录正文、Token、Cookie 或完整路径" extra={<Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>筛选日志</Button>} />{logs === null ? <LoadingState /> : <ResponsiveDataView items={entities} onOpen={(item) => { window.location.href = `/logs/${item.id}`; }} />}<FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} title="日志筛选"><Form layout="vertical"><Form.Item label="AI Client"><Select options={["ChatGPT MCP","私人 GPT Action","MCP Inspector"].map((x) => ({ value: x, label: x }))} /></Form.Item><Form.Item label="Tool / Connection"><Input placeholder="搜索 Tool 或 Connection" /></Form.Item><Form.Item label="风险"><Checkbox.Group options={["低风险","中风险","高风险"]} /></Form.Item><Button block type="primary" onClick={() => setFilterOpen(false)}>应用筛选</Button></Form></FilterDrawer></>;
}

function ResendPanel() {
  const [api, holder] = message.useMessage();
  return <>{holder}<Card style={{ marginBottom: 16 }} title="Resend 通知配置" extra={<Tag color="success">域名已验证（Mock）</Tag>}><Row gutter={[16,16]} align="middle"><Col xs={24} md={15}><Descriptions size="small" column={1} items={[{ key: "domain", label: "发件域名", children: "pgnotify.happyfirst.top" }, { key: "key", label: "API Key", children: <SecretField prefix="re_82a1" /> }]} /></Col><Col xs={24} md={9}><Space wrap><Button icon={<SendOutlined />} onClick={() => api.success("测试邮件发送成功（Mock）")}>模拟成功</Button><Button danger onClick={() => api.error("测试发送失败：域名未验证（Mock）")}>模拟失败</Button></Space></Col></Row></Card></>;
}

function Settings() {
  const [oauth, setOauth] = useState(true); const [kill, setKill] = useState(false);
  return <><PageHeader title="系统设置" subtitle="安全、认证、通知与紧急控制" /><Row gutter={[16,16]}><Col xs={24} lg={12}><Card title="OAuth 连接状态" extra={<Tag color={oauth ? "success" : "default"}>{oauth ? "已连接" : "已撤销"}</Tag>}><p>ChatGPT MCP · Authorization Code + PKCE</p><p>Scope：mail.read notes.read files.read</p><Button danger disabled={!oauth} onClick={() => { if (window.confirm("确认撤销 OAuth Grant？客户端将立即失去访问权限。")) setOauth(false); }}>模拟撤销授权</Button></Card></Col><Col xs={24} lg={12}><Card title="全局 Kill Switch" extra={<PoweroffOutlined style={{ color: kill ? "var(--pg-error)" : "var(--pg-success)" }} />}><Alert type={kill ? "error" : "success"} showIcon message={kill ? "所有 AI 调用已停止" : "所有 AI 调用已启用"} /><Divider /><Switch checked={kill} onChange={(next) => { if (!next || window.confirm("二次确认：立即停止所有 MCP 与 Action 调用？")) setKill(next); }} checkedChildren="已停止" unCheckedChildren="运行中" /></Card></Col><Col xs={24}><Card title="安全默认值"><Descriptions column={{ xs: 1, md: 2 }} items={[{ key: "readonly", label: "V1 Tool", children: "默认只读" }, { key: "cipher", label: "凭证加密", children: "AES-256-GCM" }, { key: "audit", label: "审计保留", children: "调用 90 天 / 安全事件 180 天" }, { key: "ssrf", label: "外部请求", children: "域名白名单 + 超时 + 响应上限" }]} /></Card></Col></Row></>;
}
