# Personal Gateway

> **项目状态：Prototype / 暂停开发**

Personal Gateway 是一个面向个人 AI 场景的“个人服务网关”高保真原型，尝试把个人拥有的不同服务统一接入、统一发布成 AI 可调用的标准端点，并集中管理调用记录、权限和运行状态。

**当前仓库只是产品与交互原型，不是可直接用于生产环境的网关实现。**

目前项目中的业务数据、服务连接、Discovery、OAuth、API 调用和调用记录均为 Mock；不会连接真实邮箱、网盘、笔记服务，也不会保存真实凭证。

## 为什么做这个项目

个人 AI Agent / MCP 客户端越来越多，但个人服务通常分散在不同协议和认证体系中，例如：

- MCP Server
- OpenAPI / REST API
- IMAP / SMTP
- WebDAV / CalDAV
- 各种私有 API

Personal Gateway 最初希望提供一个统一抽象：

```text
个人服务
   ↓
服务接入
   ↓
统一能力模型
   ↓
端点发布
   ↓
MCP / OpenAPI
   ↓
ChatGPT / Agent / 其他 AI 客户端
```

并在中间统一处理认证、权限、调用记录和运行状态。

## 核心产品流程

原型围绕以下主流程设计：

```text
服务接入 → 端点发布 → AI 调用 → 调用记录
```

### 1. 服务接入

计划支持三类接入方式：

- MCP
- OpenAPI
- 传统个人服务协议，例如 IMAP / SMTP / CalDAV / WebDAV

服务接入后，会统一抽象为“能力”。

### 2. 端点发布

把一个或多个服务能力组合后发布为标准 AI 端点，原设计支持：

- MCP
- OpenAPI

端点层负责定义：

- 暴露哪些能力
- 哪些调用方可以使用
- 权限范围
- 认证方式
- 调用限制

### 3. AI 调用

ChatGPT、Agent 或其他客户端通过标准端点调用个人服务，而不是直接连接每一个后端系统。

### 4. 调用记录

所有协议最终映射成统一调用记录模型，例如：

- 时间
- 调用方
- 端点
- 服务
- 能力
- 执行结果
- 耗时
- 请求编号

目标是让不同协议、不同服务的调用能够在同一个界面中审计和排查。

## 当前原型页面

- `/dashboard`：网关总览、调用趋势、最近调用
- `/services`：服务列表
- `/services/new`：服务接入向导
- `/services/[id]`：服务详情与能力
- `/endpoints`：端点列表
- `/endpoints/new`：端点发布向导
- `/endpoints/[id]`：端点、能力权限和调用方详情
- `/calls`：统一调用记录与筛选
- `/calls/[id]`：单次调用链详情
- `/settings`：运行、数据、系统状态、认证和通知预留
- `/login`：Mock 登录页

## 技术栈

- Next.js App Router
- React
- TypeScript strict mode
- Ant Design 5
- Ant Design Charts
- CSS Modules
- Zod
- Vitest
- Playwright

## 运行

```bash
npm ci
npm run dev
```

常用验证：

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 重要说明：这是原型

这个仓库的主要价值在于：

- 产品信息架构
- 服务 / 能力 / 端点之间的抽象关系
- 接入与发布流程
- 调用记录模型
- 管理后台交互设计

它**没有完成真正的网关运行时**，包括但不限于：

- 真实 MCP Discovery
- 真实 MCP Proxy / Aggregation
- OpenAPI 动态代理
- OAuth / OIDC 完整实现
- Secrets 管理
- 数据库存储
- 多租户
- 权限执行引擎
- 请求转发和协议转换
- 生产级日志与审计

因此不要把当前仓库直接部署为处理真实个人凭证的生产服务。

## 为什么暂停开发

项目启动时，我希望做一个统一的个人 AI 服务入口。

随着后续实践，**Cloudflare 已经提供了与这个方向明显重叠的 MCP、网关、访问控制等相关能力**。对于个人使用场景，继续从零实现一整套网关的投入产出比已经发生变化，因此目前暂停这个项目的主动开发计划。

这并不代表这个方向没有价值。相反，我仍然认为“个人服务统一接入 → 能力治理 → 标准端点发布 → AI 调用审计”是一个值得探索的问题，只是现阶段我会优先使用成熟平台能力，而不是继续重复建设底层基础设施。

## 如果你想继续这个方向

非常欢迎有兴趣的开发者 fork 或继续完善这个项目。

如果有哪位大神愿意沿着这个方向继续开发，我会非常感谢。

一些可能值得继续实现的方向：

- 真正的 MCP Server 聚合与转发
- MCP ↔ OpenAPI 能力映射
- OAuth 2.1 / OIDC
- Secrets 与凭证托管
- IMAP / SMTP / WebDAV / CalDAV Adapter
- Endpoint 级权限模型
- Tool 级读写权限与风险分级
- 多客户端身份管理
- 调用日志、Tracing 与审计
- Cloudflare Workers / Durable Objects / D1 等边缘实现
- 与现有 Cloudflare MCP 能力互补，而不是简单重复实现

如果要继续开发，建议优先保留当前的产品抽象：

```text
Service → Capability → Endpoint → Caller → Invocation
```

这套模型是整个原型最核心的设计思路。

## 安全

当前版本全部使用 Mock 数据。

如果未来接入真实服务，请至少做到：

- 不把 Token、密码、OAuth Client Secret 等写入 Git
- 使用专门的 Secret Store
- 明确区分只读与写入能力
- 对高风险 Tool 做最小权限控制
- 记录调用者身份和审计日志
- 对外部 URL、Webhook、代理目标做 SSRF 防护
- 对 MCP Tool 输入做严格 Schema 校验

## 贡献

Issue、讨论和 Pull Request 都欢迎。

由于原作者当前暂停主动开发，较大的功能 PR 建议在实现前先描述整体架构思路，避免把原型演变成难以维护的单体代理。

## License

MIT
