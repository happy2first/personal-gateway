# Personal Gateway

个人网关 V2 高保真响应式原型。产品主流程固定为“服务接入 → 端点发布 → AI 调用 → 调用记录”。

全部业务数据、连接测试、Discovery、OAuth 与 API 调用均为 Mock，不连接真实服务，不保存真实凭证。

## 页面

- /dashboard：网关运行总览、三类调用图表、最近调用
- /services、/services/new、/services/[id]：服务接入、三类向导与服务详情
- /endpoints、/endpoints/new、/endpoints/[id]：端点发布、能力权限、多调用方与详情
- /calls、/calls/[id]：统一调用记录、筛选与调用链
- /settings：运行、数据、系统状态、身份认证预留、通知
- /login：Mock 登录

## 技术栈

Next.js App Router、React、TypeScript strict、Ant Design 5、Ant Design Charts、CSS Modules、Zod、Vitest、Playwright。

## 验证

npm ci；npm run lint；npm run typecheck；npm test；npm run build；npm run test:e2e。
