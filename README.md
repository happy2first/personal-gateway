# Personal Gateway

个人网关工程化 H5 响应式管理后台原型。使用 Mock 数据演示 Tool/Connection、Publication/Client/Grant、日志/安全事件/告警三大模块。

## 演示

- 登录：`demo@personal.gateway`，密码任意。
- 不使用任何真实个人账号、Token、OAuth 或 API Secret。

## 页面

`/login`、`/dashboard`、`/tools`、`/tools/new-rest`、`/tools/import-openapi`、`/tools/import-mcp`、`/tools/[id]`、`/connections`、`/connections/new`、`/connections/[id]`、`/publications`、`/publications/new`、`/publications/[id]`、`/clients`、`/clients/new`、`/clients/[id]`、`/grants`、`/logs`、`/logs/[id]`、`/security-events`、`/alerts`、`/settings`。

## 本地验证

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 技术栈

Next.js 16 App Router、TypeScript strict、Ant Design 5、Ant Design Next.js Registry、ProComponents、CSS Modules、Zod、Vitest、Playwright。

## 部署

`work/prototype-v1` 连接 Vercel Preview；验收通过后经 PR 合并 `main` 并部署 Production。GitHub 是代码唯一事实源。
