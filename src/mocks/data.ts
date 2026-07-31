import type { AuditLog, GatewayEntity } from "@/services/contracts/gateway";

const now = "2026-07-31 17:40";

export const mockEntities: Record<string, GatewayEntity[]> = {
  tools: [
    { id: "mail-search", name: "搜索邮件", description: "按条件搜索邮件，通用 ImapExecutor", status: "normal", kind: "IMAP", updatedAt: now, risk: "low", meta: "mail_search_messages" },
    { id: "file-search", name: "搜索百度网盘", description: "通过 REST 配置搜索文件", status: "warning", kind: "REST", updatedAt: now, risk: "low", meta: "files_search" },
    { id: "note-search", name: "搜索印象笔记", description: "只读检索笔记", status: "normal", kind: "EDAM", updatedAt: now, risk: "low", meta: "notes_search" },
    { id: "binance-ticker", name: "币安公共行情", description: "查询公开市场行情", status: "normal", kind: "REST", updatedAt: now, risk: "low", meta: "market_ticker" },
    { id: "remote-weather", name: "示例远程 MCP 天气", description: "从远程 MCP 发现并导入", status: "draft", kind: "Remote MCP", updatedAt: now, risk: "medium", meta: "weather_lookup" },
  ],
  connections: [
    { id: "qq-mail", name: "我的 QQ 邮箱", description: "QQ IMAP 只读模板", status: "normal", kind: "IMAP", updatedAt: now, meta: "imap.qq.com:993" },
    { id: "163-mail", name: "我的 163 邮箱", description: "163 IMAP 只读模板", status: "draft", kind: "IMAP", updatedAt: now, meta: "待完成连接测试" },
    { id: "baidu", name: "我的百度网盘", description: "OAuth Token 临近到期", status: "warning", kind: "REST/OAuth", updatedAt: now, meta: "剩余 5 天" },
    { id: "evernote", name: "我的印象笔记", description: "EDAM 连接", status: "normal", kind: "EDAM", updatedAt: now, meta: "健康" },
    { id: "binance", name: "币安公共行情 REST", description: "无需个人凭证", status: "normal", kind: "REST", updatedAt: now, meta: "api.binance.com" },
    { id: "sample-mcp", name: "示例远程 MCP", description: "已发现 4 个工具", status: "normal", kind: "Remote MCP", updatedAt: now, meta: "Streamable HTTP" },
  ],
  publications: [
    { id: "personal-mcp", name: "个人数据只读 MCP", description: "向 ChatGPT 发布 4 个只读工具", status: "normal", kind: "MCP", updatedAt: now, meta: "/api/mcp/personal-readonly" },
    { id: "gpt-actions", name: "私人 GPT Action API", description: "以 OpenAPI 发布行情和文件搜索", status: "normal", kind: "OpenAPI", updatedAt: now, meta: "/openapi/private-actions.json" },
  ],
  clients: [
    { id: "chatgpt", name: "ChatGPT MCP 客户端", description: "OAuth 2.1 已连接", status: "normal", kind: "ChatGPT MCP", updatedAt: now, meta: "4 Tools · mail.read files.read" },
    { id: "private-gpt", name: "私人 GPT Action 客户端", description: "Bearer API Key", status: "normal", kind: "GPT Action", updatedAt: now, meta: "pg_live_82a1••••" },
    { id: "inspector", name: "MCP Inspector 测试客户端", description: "仅限测试环境", status: "warning", kind: "MCP Inspector", updatedAt: now, meta: "1 Tool · 10 req/min" },
  ],
  grants: [
    { id: "grant-chatgpt", name: "ChatGPT → 个人数据只读 MCP", description: "Publication + Tool + Scope 授权", status: "normal", kind: "OAuth Grant", updatedAt: now, meta: "mail.read notes.read files.read" },
    { id: "grant-gpt", name: "私人 GPT → Action API", description: "仅行情与文件搜索", status: "normal", kind: "API Key Grant", updatedAt: now, meta: "market.read files.search" },
  ],
  "security-events": [
    { id: "sec-01", name: "越权 Tool 调用已拒绝", description: "私人 GPT 尝试调用 mail_search_messages", status: "error", kind: "授权拒绝", updatedAt: now, risk: "high", meta: "已阻断" },
    { id: "sec-02", name: "百度网盘凭证即将到期", description: "请在 5 天内更新 OAuth Token", status: "warning", kind: "凭证到期", updatedAt: now, risk: "medium", meta: "未处理" },
    { id: "sec-03", name: "总闸配置已修改", description: "管理员恢复 MCP 调用", status: "normal", kind: "配置审计", updatedAt: now, risk: "medium", meta: "已确认" },
  ],
  alerts: [
    { id: "credential-expiry", name: "凭证到期提醒", description: "到期前 7 天发送邮件", status: "normal", kind: "Resend", updatedAt: now, meta: "pgnotify.happyfirst.top" },
    { id: "failure-burst", name: "连续失败告警", description: "5 分钟内连续失败 3 次", status: "normal", kind: "Resend", updatedAt: now, meta: "冷却 30 分钟" },
  ],
};

export const mockLogs: AuditLog[] = [
  { id: "req-9f2a", name: "搜索邮件", description: "返回 12 条脱敏元数据", status: "normal", kind: "MCP", updatedAt: "17:38:22", risk: "low", client: "ChatGPT MCP", tool: "mail_search_messages", connection: "我的 QQ 邮箱", duration: 428, result: "success" },
  { id: "req-81bc", name: "搜索百度网盘", description: "上游 Token 临近到期", status: "warning", kind: "OpenAPI", updatedAt: "17:31:09", risk: "medium", client: "私人 GPT Action", tool: "files_search", connection: "我的百度网盘", duration: 842, result: "failed" },
  { id: "req-73a0", name: "读取邮件正文", description: "客户端无 mail.body Scope", status: "error", kind: "OpenAPI", updatedAt: "17:22:50", risk: "high", client: "私人 GPT Action", tool: "mail_read_body", connection: "我的 QQ 邮箱", duration: 19, result: "denied" },
  { id: "req-6d11", name: "查询币安行情", description: "返回 BTCUSDT 行情", status: "normal", kind: "OpenAPI", updatedAt: "17:18:02", risk: "low", client: "MCP Inspector", tool: "market_ticker", connection: "币安公共行情 REST", duration: 211, result: "success" },
];
