"use client";
import { DeleteOutlined, PlusOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, DatePicker, Form, Grid, Input, InputNumber, List, Radio, Select, Switch, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ConnectionHealth, ResponsiveDrawer, SecretField } from "@/components/Shared";
import { calculateExpiry, credentialStatus, readableDuration, requestPreview, type AuthConfig, type AuthType, type CredentialExpiry, type CredentialKeyValue, type CredentialLocation, type CredentialValueType, type InjectionMode } from "@/services/credentials";
import styles from "./Gateway.module.css";

const authOptions: { value: AuthType; label: string; description: string }[] = [
  { value: "none", label: "无认证", description: "上游服务不要求身份凭证" },
  { value: "bearer", label: "Bearer Token", description: "通过 Authorization Bearer 请求头发送" },
  { value: "api_key", label: "API Key / Token", description: "支持标准请求注入或协议专用注入" },
  { value: "basic", label: "Basic Auth", description: "使用用户名与密码进行基础认证" },
  { value: "oauth2", label: "OAuth 2.0", description: "使用客户端凭证与访问令牌" },
  { value: "custom", label: "自定义键值", description: "配置多组 Header、Query 或 Cookie 参数" },
];

const initialIssuedAt = "2026-08-01T12:00:00.000Z";
const unknownExpiry: CredentialExpiry = { mode: "unknown", source: "manual" };
function useCurrentTime() { const [now, setNow] = useState(0); useEffect(() => { const timer = window.setTimeout(() => setNow(Date.now()), 0); return () => window.clearTimeout(timer); }, []); return now; }

export function CredentialExpiryField({ value, onChange }: { value: CredentialExpiry; onChange: (value: CredentialExpiry) => void }) {
  const [timezone, setTimezone] = useState("UTC");
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const now = useCurrentTime();
  useEffect(() => { const timer = window.setTimeout(() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), 0); return () => window.clearTimeout(timer); }, []);
  const setMode = (mode: CredentialExpiry["mode"]) => {
    if (mode === "unknown") onChange({ mode, source: "manual" });
    if (mode === "datetime") onChange({ mode, source: "manual" });
    if (mode === "duration") onChange({ mode, issuedAt: initialIssuedAt, expiresInSeconds: 2592000, expiresAt: calculateExpiry(initialIssuedAt, 2592000), source: "calculated" });
  };
  const updateDuration = (issuedAt?: string, seconds?: number | null) => {
    const next: CredentialExpiry = { mode: "duration", issuedAt, expiresInSeconds: seconds ?? undefined, source: "calculated" };
    if (issuedAt && seconds && Number.isInteger(seconds) && seconds > 0) next.expiresAt = calculateExpiry(issuedAt, seconds);
    onChange(next);
  };
  const updateLocalDateTime = (current: string | undefined, part: "date" | "time", nextValue: string, mode: "datetime" | "duration") => {
    const date = current ? new Date(current) : new Date();
    if (part === "date") {
      const [year, month, day] = nextValue.split("-").map(Number);
      date.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = nextValue.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    const iso = date.toISOString();
    if (mode === "duration") updateDuration(iso, value.expiresInSeconds);
    else onChange({ mode: "datetime", expiresAt: iso, source: "manual" });
  };
  const localParts = (iso?: string) => {
    const date = iso ? new Date(iso) : new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    return { date: local.slice(0, 10), time: local.slice(11, 16) };
  };
  return <div className={styles.expiryField}>
    <Radio.Group value={value.mode} onChange={event => setMode(event.target.value)} options={[{ label: "未提供或未知", value: "unknown" }, { label: "指定过期日期时间", value: "datetime" }, { label: "按有效时长计算", value: "duration" }]}/>
    {value.mode === "unknown" ? <Alert type="info" showIcon message="有效期未知" description="未填写过期时间不等于永久有效；建议通过测试或供应商响应补全。"/> : null}
    {value.mode === "datetime" ? <div className={styles.formGrid}>
      <Form.Item label={mobile ? "过期日期" : "过期日期与时间"} required>{mobile ? <Input aria-label="过期日期" type="date" value={localParts(value.expiresAt).date} onChange={event => updateLocalDateTime(value.expiresAt, "date", event.target.value, "datetime")}/> : <DatePicker showTime value={value.expiresAt ? dayjs(value.expiresAt) : null} style={{ width: "100%" }} onChange={date => onChange({ mode: "datetime", expiresAt: date?.toDate().toISOString(), source: "manual" })}/>}</Form.Item>
      {mobile ? <Form.Item label="过期时间" required><Input aria-label="过期时间" type="time" value={localParts(value.expiresAt).time} onChange={event => updateLocalDateTime(value.expiresAt, "time", event.target.value, "datetime")}/></Form.Item> : null}
      <Form.Item label="时区"><Input readOnly value={timezone}/></Form.Item>
      {value.expiresAt ? <Alert className={styles.span2} type={now > 0 && Date.parse(value.expiresAt) <= now ? "error" : "success"} showIcon message={`本地时间：${new Date(value.expiresAt).toLocaleString()}`} description={`UTC：${value.expiresAt}`}/> : null}
    </div> : null}
    {value.mode === "duration" ? <div className={styles.formGrid}>
      <Form.Item label={mobile ? "起算日期" : "起算时间"} required>{mobile ? <Input aria-label="起算日期" type="date" value={localParts(value.issuedAt).date} onChange={event => updateLocalDateTime(value.issuedAt, "date", event.target.value, "duration")}/> : <DatePicker showTime value={value.issuedAt ? dayjs(value.issuedAt) : null} style={{ width: "100%" }} onChange={date => updateDuration(date?.toDate().toISOString(), value.expiresInSeconds)}/>}</Form.Item>
      {mobile ? <Form.Item label="起算时间" required><Input aria-label="起算时间" type="time" value={localParts(value.issuedAt).time} onChange={event => updateLocalDateTime(value.issuedAt, "time", event.target.value, "duration")}/></Form.Item> : null}
      <Form.Item label="有效时长（秒）" required extra="从起算时间开始计算的相对时长，不是 Unix 时间戳。"><InputNumber aria-label="有效时长（秒）" min={1} precision={0} value={value.expiresInSeconds} addonAfter="秒" style={{ width: "100%" }} onChange={seconds => updateDuration(value.issuedAt, seconds)}/></Form.Item>
      {value.expiresAt && value.expiresInSeconds ? <Alert className={styles.span2} type="success" showIcon message={`易读结果：${readableDuration(value.expiresInSeconds)}`} description={`计算过期：${new Date(value.expiresAt).toLocaleString()}（${value.expiresAt}）`}/> : null}
    </div> : null}
  </div>;
}

type DraftKeyValue = CredentialKeyValue & { value: string };
const defaultKeyValue = (id: string): DraftKeyValue => ({ id, location: "header", name: "", value: "", credentialKey: `credential.custom.${id}`, valueType: "string", secret: true, enabled: true });

export function CredentialKeyValueEditor({ rows, onChange }: { rows: DraftKeyValue[]; onChange: (rows: DraftKeyValue[]) => void }) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const duplicateNames = rows.filter((row, index) => row.enabled && rows.findIndex(other => other.enabled && other.location === row.location && other.name.trim() === row.name.trim()) !== index).map(row => row.id);
  const update = (id: string, field: keyof DraftKeyValue, value: string | boolean) => onChange(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  const editor = (row: DraftKeyValue) => <>
    <Select aria-label="注入位置" value={row.location} options={[{ label: "Header", value: "header" }, { label: "Query", value: "query" }, { label: "Cookie", value: "cookie" }]} onChange={(value: CredentialLocation) => update(row.id, "location", value)}/>
    <Input aria-label="参数名称" value={row.name} status={duplicateNames.includes(row.id) ? "error" : undefined} placeholder="参数名称" onChange={event => update(row.id, "name", event.target.value)}/>
    <Select aria-label="值类型" value={row.valueType} options={["string", "number", "boolean", "json"].map(value => ({ label: value, value }))} onChange={(value: CredentialValueType) => update(row.id, "valueType", value)}/>
    <SecretField ariaLabel="参数值" value={row.value} onChange={value => update(row.id, "value", value)}/>
    <Input aria-label="值前缀" value={row.prefix} placeholder="可选前缀" onChange={event => update(row.id, "prefix", event.target.value)}/>
    <Switch aria-label="启用参数" checked={row.enabled} onChange={value => update(row.id, "enabled", value)}/>
    <Button danger aria-label="删除参数" icon={<DeleteOutlined/>} onClick={() => onChange(rows.filter(item => item.id !== row.id))}/>
  </>;
  return <>
    {duplicateNames.length ? <Alert type="error" showIcon message="同一注入位置不能使用重复参数名"/> : null}
    {!mobile ? <div className={styles.credentialRows}><div className={styles.credentialHeader}><span>位置</span><span>参数名称</span><span>值类型</span><span>值</span><span>前缀</span><span>启用</span><span/></div>{rows.map(row => <div className={styles.credentialRow} key={row.id}>{editor(row)}</div>)}</div> : null}
    {mobile ? <div className={styles.credentialCards}>{rows.map((row, index) => <Card size="small" title={`参数 ${index + 1}`} key={row.id}><div className={styles.credentialCardFields}>{editor(row)}</div></Card>)}</div> : null}
    <Button block type="dashed" icon={<PlusOutlined/>} onClick={() => onChange([...rows, defaultKeyValue(`row-${rows.length + 1}`)])}>新增键值</Button>
  </>;
}

export type ServiceTemplate = "generic" | "baidu" | "evernote" | "qq" | "163";
function defaults(template: ServiceTemplate): { auth: AuthType; injectionMode: InjectionMode; location: CredentialLocation; parameterName: string; tokenName: string; prefix: string; expiry: CredentialExpiry } {
  if (template === "baidu") return { auth: "api_key", injectionMode: "standard", location: "query", parameterName: "access_token", tokenName: "百度网盘 Access Token", prefix: "", expiry: { mode: "duration", issuedAt: initialIssuedAt, expiresInSeconds: 2592000, expiresAt: calculateExpiry(initialIssuedAt, 2592000), source: "calculated" } };
  if (template === "evernote") return { auth: "api_key", injectionMode: "protocol", location: "header", parameterName: "authToken", tokenName: "印象笔记 API Token", prefix: "", expiry: unknownExpiry };
  if (template === "qq" || template === "163") return { auth: "api_key", injectionMode: "protocol", location: "header", parameterName: "mailAuthorizationCode", tokenName: "邮箱授权码", prefix: "", expiry: unknownExpiry };
  return { auth: "none", injectionMode: "standard", location: "header", parameterName: "X-API-Key", tokenName: "Token", prefix: "", expiry: unknownExpiry };
}

export function CredentialsPanel({ template, onValidationChange }: { template: ServiceTemplate; onValidationChange?: (valid: boolean) => void }) {
  const initial = useMemo(() => defaults(template), [template]);
  const [auth, setAuth] = useState<AuthType>(initial.auth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [injectionMode, setInjectionMode] = useState<InjectionMode>(initial.injectionMode);
  const [location, setLocation] = useState<CredentialLocation>(initial.location);
  const [parameterName, setParameterName] = useState(initial.parameterName);
  const [tokenName, setTokenName] = useState(initial.tokenName);
  const [prefix, setPrefix] = useState(initial.prefix);
  const [expiry, setExpiry] = useState<CredentialExpiry>(initial.expiry);
  const [customRows, setCustomRows] = useState<DraftKeyValue[]>([defaultKeyValue("row-1")]);
  const now = useCurrentTime();
  const needsToken = auth === "bearer" || auth === "api_key";
  const duplicateCustom = customRows.some((row, index) => row.enabled && customRows.findIndex(other => other.enabled && other.location === row.location && other.name.trim() === row.name.trim()) !== index);
  const expiryComplete = expiry.mode === "unknown" || Boolean(expiry.expiresAt && (expiry.mode === "datetime" || (expiry.issuedAt && expiry.expiresInSeconds)));
  const invalidByTime = Boolean(now > 0 && expiry.expiresAt && Date.parse(expiry.expiresAt) <= now);
  const valid = auth === "none" || (needsToken && Boolean(token) && expiryComplete && !invalidByTime) || (auth === "basic" && Boolean(username && password) && expiryComplete && !invalidByTime) || (auth === "oauth2" && Boolean(clientId && clientSecret) && expiryComplete && !invalidByTime) || (auth === "custom" && customRows.length > 0 && customRows.every(row => !row.enabled || Boolean(row.name && row.value)) && !duplicateCustom && expiryComplete && !invalidByTime);
  useEffect(() => onValidationChange?.(valid), [onValidationChange, valid]);
  const selected = authOptions.find(option => option.value === auth)!;
  const chooseAuth = (value: AuthType) => { setAuth(value); setDrawerOpen(false); };
  const authConfig: AuthConfig = { type: auth, injectionMode, location, parameterName, prefix, credentialKey: auth === "none" ? undefined : `credential.${template}.primary`, expiry, executor: template === "evernote" ? "EdamExecutor" : template === "qq" || template === "163" ? "MailExecutor" : undefined, custom: auth === "custom" ? customRows.map(row => ({ id: row.id, location: row.location, name: row.name, credentialKey: row.credentialKey, valueType: row.valueType, prefix: row.prefix, secret: row.secret, enabled: row.enabled })) : undefined };
  return <div className={styles.credentialSections}>
    <Alert type="info" showIcon message="配置网关访问上游服务所使用的认证和凭证。" description="端点调用方认证请在“端点发布”中配置。"/>
    <Card size="small" title="1. 认证方式">
      <Form layout="vertical"><Form.Item label="认证方式" required>
        <div className={styles.desktopAuthSelect}><Select value={auth} options={authOptions.map(({ value, label }) => ({ value, label }))} onChange={chooseAuth}/></div>
        <Button className={styles.mobileAuthSelect} block onClick={() => setDrawerOpen(true)}>{selected.label}<span className={styles.muted}>{selected.description}</span></Button>
      </Form.Item></Form>
      <ResponsiveDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="选择认证方式"><List dataSource={authOptions} renderItem={option => <List.Item className={styles.authOption} onClick={() => chooseAuth(option.value)}><List.Item.Meta title={option.label} description={option.description}/>{option.value === auth ? <SafetyCertificateOutlined/> : null}</List.Item>}/></ResponsiveDrawer>
    </Card>
    <Card size="small" title="2. 凭证内容">
      {auth === "none" ? <Alert type="warning" showIcon message="该服务不会携带上游认证信息"/> : null}
      {auth === "bearer" ? <Form layout="vertical"><Form.Item label="Bearer Token" required><SecretField value={token} onChange={setToken}/></Form.Item></Form> : null}
      {auth === "api_key" ? <Form layout="vertical"><div className={styles.formGrid}><Form.Item label="Token 名称" required><Input value={tokenName} onChange={event => setTokenName(event.target.value)}/></Form.Item><Form.Item label="Token 值" required><SecretField value={token} onChange={setToken} placeholder={template === "evernote" ? "例如：[DEMO_EVERNOTE_TOKEN]" : "仅输入虚构测试凭证"}/></Form.Item></div></Form> : null}
      {auth === "basic" ? <Form layout="vertical"><div className={styles.formGrid}><Form.Item label="用户名" required><Input value={username} onChange={event => setUsername(event.target.value)}/></Form.Item><Form.Item label="密码" required><SecretField ariaLabel="密码" value={password} onChange={setPassword}/></Form.Item></div></Form> : null}
      {auth === "oauth2" ? <Form layout="vertical"><div className={styles.formGrid}><Form.Item label="授权地址"><Input placeholder="https://provider.example/authorize"/></Form.Item><Form.Item label="令牌地址"><Input placeholder="https://provider.example/token"/></Form.Item><Form.Item label="Client ID" required><Input value={clientId} onChange={event => setClientId(event.target.value)}/></Form.Item><Form.Item label="Client Secret" required><SecretField ariaLabel="Client Secret" value={clientSecret} onChange={setClientSecret}/></Form.Item><Form.Item label="授权范围"><Input placeholder="read write"/></Form.Item><Form.Item label="PKCE"><Switch defaultChecked/> 启用</Form.Item></div></Form> : null}
      {auth === "custom" ? <CredentialKeyValueEditor rows={customRows} onChange={setCustomRows}/> : null}
    </Card>
    {auth !== "none" ? <Card size="small" title="3. 有效期与更新"><CredentialExpiryField value={expiry} onChange={setExpiry}/><Form layout="vertical"><Form.Item label="更新方式"><Select defaultValue="manual" options={[{ label: "手动更新", value: "manual" }, { label: "供应商响应自动更新", value: "provider" }]}/></Form.Item></Form></Card> : null}
    <Card size="small" title="4. 注入方式或认证摘要">
      {auth === "api_key" ? <Form layout="vertical"><Form.Item label="注入模式"><Radio.Group value={injectionMode} onChange={event => setInjectionMode(event.target.value)} options={[{ label: "标准请求注入", value: "standard" }, { label: "协议专用注入", value: "protocol" }]}/></Form.Item>{injectionMode === "standard" ? <div className={styles.formGrid}><Form.Item label="注入位置"><Select value={location} options={[{ label: "Header", value: "header" }, { label: "Query", value: "query" }, { label: "Cookie", value: "cookie" }]} onChange={setLocation}/></Form.Item><Form.Item label="参数名称"><Input value={parameterName} onChange={event => setParameterName(event.target.value)}/></Form.Item><Form.Item label="可选值前缀"><Input value={prefix} placeholder="例如：Token" onChange={event => setPrefix(event.target.value)}/></Form.Item></div> : <Alert type="info" showIcon message={template === "evernote" ? "印象笔记 EDAM 协议专用注入" : "协议专用注入"} description={template === "evernote" ? "该 Token 由印象笔记 EDAM Executor 作为 authToken 参数使用，不会作为普通 Header 或 Query 参数注入。" : "由对应 Executor 或连接模板负责注入，不要求选择 Header、Query 或 Cookie。"}/>}</Form> : null}
      <div className={styles.authSummary}><Typography.Text strong>调用预览</Typography.Text><Typography.Text code>{requestPreview(authConfig, template === "baidu" ? "/sse" : "/upstream")}</Typography.Text><ConnectionHealth status={credentialStatus(expiry, new Date(now))}/><Typography.Text type="secondary">配置只保存 credentialKey 引用；expires_in 仅作为元数据，不发送给上游。</Typography.Text></div>
    </Card>
    {invalidByTime ? <Alert type="error" showIcon message="凭证已过期" description="可保存为草稿，但禁止测试和调用。请更新凭证后继续。"/> : null}
  </div>;
}
