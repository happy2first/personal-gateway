# 原型信息架构与 Ant Design UI 规范 V1.0

> 个人网关项目｜H5响应式原型、页面结构与一致性实施规范\
> 实施模式：ChatGPT Work + GitHub + Vercel\
> 日期：2026-07-31

## 1. UI技术方案

-   Next.js App Router + TypeScript
-   Ant Design 5（唯一基础组件库）
-   @ant-design/nextjs-registry
-   @ant-design/pro-components（PC端选择性使用）
-   ConfigProvider + Design Token
-   Ant Design Grid/useBreakpoint + CSS Modules
-   Playwright四档响应式测试

不引入Tailwind、MUI、shadcn或Ant Design Mobile。

## 2. 一级导航

-   首页/仪表盘
-   工具与连接
-   AI接入
-   日志与告警
-   系统设置/更多

## 3. 页面树

``` text
登录
仪表盘
工具与连接
├─ 工具列表、详情、测试
├─ 连接列表、详情、测试
├─ 新增REST工具
├─ 导入OpenAPI
└─ 注册远程MCP
AI接入
├─ Publication
├─ AI客户端
├─ 授权关系
└─ API Key / OAuth
日志与告警
├─ 调用日志
├─ 安全事件
├─ 告警规则
└─ 通知配置
```

## 4. 响应式规则

  宽度       导航              列表              编辑
  ---------- ----------------- ----------------- -----------------
  \<576      顶部栏+底部导航   Card/List         全屏Drawer/页面
  576--767   顶部栏+底部导航   卡片              全屏/90% Drawer
  768--991   折叠侧栏          精简Table或卡片   右侧Drawer
  ≥992       固定侧栏          ProTable          Drawer/Modal

PC表格必须有对应手机卡片视图；375px不得出现页面级横向滚动。

## 5. 设计Token

-   primary: #1677FF
-   layout background: #F5F7FA
-   container: #FFFFFF
-   text: #1F2937
-   secondary text: #6B7280
-   border: #E5E7EB
-   success: #52C41A
-   warning: #FAAD14
-   error: #FF4D4F
-   radius: 8 / 12

页面禁止散落自定义颜色，全部通过ConfigProvider或CSS变量引用。

## 6. 必须先建立的共享组件

-   AppShell
-   PageHeader
-   ResponsiveDataView
-   ResponsiveDrawer
-   FilterDrawer
-   EntityStatusTag
-   SecretField
-   ConnectionHealth
-   RiskBadge
-   EmptyState
-   ErrorState
-   CodePreview

## 7. Work开发规则

1.  先读取两份基线文档。
2.  先建主题、AppShell和共享组件，再建业务页面。
3.  页面必须同时实现PC与手机视图。
4.  使用Mock数据，不配置真实凭证。
5.  使用 `work/prototype-*` 分支。
6.  每个阶段提交GitHub并生成Vercel Preview。
7.  不得擅自引入第二套UI库或改变主题。
8.  通过375/768/1024/1440四档Playwright检查。

## 8. 原型阶段

-   P0：主题、壳层、导航、共享组件
-   P1：登录、仪表盘、工具/连接列表
-   P2：REST/OpenAPI/远程MCP注册流程
-   P3：Publication、客户端、授权
-   P4：日志和告警
-   P5：移动端修订和验收
