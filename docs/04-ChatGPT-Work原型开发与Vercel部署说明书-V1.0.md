# ChatGPT Work 原型开发与 Vercel 部署说明书 V1.0

> 项目：个人网关（Personal Gateway）  
> 实施空间：ChatGPT Work  
> 日期：2026-07-31

## 1. 事实源与分支

- GitHub 私有仓库 `happy2first/personal-gateway` 是代码唯一事实源。
- 原型在 `work/prototype-v1` 分支小步提交。
- 非生产分支 Push 生成 Vercel Preview；验收后通过 PR 合并 `main`。
- `main` 对应 Production，不在主分支进行大批量开发。

## 2. 冻结技术栈

Next.js App Router、TypeScript strict、Ant Design 5、`@ant-design/nextjs-registry`、选择性 ProComponents、Ant Design Icons、CSS Modules、Zod、Vitest、Playwright。禁止 Tailwind、shadcn、MUI、Chakra、Element、Ant Design Mobile 和第二套图标库。

## 3. 阶段

1. P0：文档、依赖、主题、测试、首个 Preview。
2. P1：登录、AppShell、共享组件、四档响应式。
3. P2：Tool、Connection、REST、OpenAPI、Remote MCP 与测试。
4. P3：Publication、Client、Grant、API Key 与 OAuth 状态。
5. P4：Dashboard、日志、安全事件、Resend 与 Kill Switch。
6. P5：状态补齐、375/768/1024/1440 验收、lint/typecheck/test/build、README、PR、Preview 和 Production。

## 4. 安全边界

只使用 Mock 数据；不接入真实账号、OAuth、MCP、邮箱授权码、Token 或 API Secret。Secret 保存后仅显示掩码；API Key 明文只显示一次；危险操作二次确认。

## 5. 部署验收

- 每个工作分支 Push 生成 Preview。
- 375px 无页面级横向滚动，PC Table 有手机 Card/List 视图。
- 所有规定页面可访问，关键 Mock 流程可演示。
- lint、typecheck、Vitest、Playwright、production build 均通过。
- Preview 验收通过后合并 `main` 并确认 Production READY。
