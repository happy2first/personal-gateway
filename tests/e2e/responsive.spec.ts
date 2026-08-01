import { expect, test } from "@playwright/test";

const routes = [
  "/dashboard", "/services", "/services/qq-mail", "/services/qq-mail/capabilities", "/services/new",
  "/endpoints", "/endpoints/personal-readonly", "/endpoints/personal-readonly/capabilities", "/endpoints/new",
  "/calls", "/calls/req-a91f", "/settings",
];

test("all routes render without page overflow or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const path of routes) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), path + " overflows").toBe(false);
  }
  expect(errors).toEqual([]);
});

test("endpoint wizard is Ant Design and contains eight steps", async ({ page }, testInfo) => {
  await page.goto("/endpoints/new");
  await expect(page.locator(".ant-card")).toBeVisible();
  await expect(page.getByRole("button", { name: /返\s*回/ })).toBeVisible();
  await expect(page.getByTestId("wizard-title")).toContainText("基本信息");
  await expect(page.getByLabel("端点标识")).toBeVisible();
  const titles = ["发布协议", "服务与能力", "发布配置", "权限策略", "端点认证", "调用方", "测试与发布"];
  for (const title of titles) {
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByTestId("wizard-title")).toContainText(title);
  }
  await expect(page.getByLabel("调用方名称")).toHaveCount(0);
  if (testInfo.project.name === "mobile-375") {
    const actions = await page.getByTestId("wizard-actions").boundingBox();
    expect(actions).not.toBeNull();
    expect(actions!.y + actions!.height).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
  }
});

test("service wizard uses one selection to drive one form", async ({ page }) => {
  await page.goto("/services/new");
  await expect(page.getByText("第 1/1 步 · 选择类型")).toBeVisible();
  await page.getByRole("button", { name: /API 服务/ }).click();
  await expect(page.getByText("第 1/6 步 · 基本信息")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("API 定义");
  await expect(page.getByText("OpenAPI 导入", { exact: true })).toBeVisible();
  await expect(page.getByText("手工接口定义", { exact: true })).toHaveCount(0);
  await page.getByText("手工配置", { exact: true }).click();
  await expect(page.getByText("手工接口定义", { exact: true })).toBeVisible();
  await expect(page.getByText("OpenAPI 导入", { exact: true })).toHaveCount(0);
});

test("mobile details use navigation pages and no tabs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-375", "mobile-only assertion");
  await page.goto("/services/qq-mail");
  await expect(page.getByText("原始能力", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page.getByText("原始能力", { exact: true }).click();
  await expect(page).toHaveURL(/capabilities/);
  await expect(page.getByText("搜索邮件", { exact: true })).toBeVisible();
  await page.goto("/endpoints/personal-readonly");
  await expect(page.getByText("能力与转换", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page.getByText("能力与转换", { exact: true }).click();
  await expect(page).toHaveURL(/capabilities/);
});

test("desktop details keep tabs and calls remove vendor", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "desktop-only assertion");
  await page.goto("/services/qq-mail");
  await expect(page.getByRole("tab", { name: "概览" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "关联端点" })).toBeVisible();
  await page.goto("/endpoints/personal-readonly");
  await expect(page.getByRole("tab", { name: "来源服务" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "调用方" })).toBeVisible();
  await page.goto("/calls");
  await expect(page.getByLabel("调用方")).toBeVisible();
  await expect(page.getByText("厂商", { exact: true })).toHaveCount(0);
  await expect(page.getByText("请求编号", { exact: true })).toBeVisible();
});

test("mobile call cards show the complete route and clear bottom navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-375", "mobile-only assertion");
  await page.goto("/calls");
  await expect(page.getByText("ChatGPT → 个人数据只读 MCP")).toBeVisible();
  const last = page.locator("a[href^='/calls/']").last();
  const box = await last.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThan(await page.evaluate(() => document.documentElement.scrollHeight));
  await page.getByRole("button", { name: "筛选" }).click();
  await expect(page.getByLabel("调用方")).toBeVisible();
  await expect(page.getByText("厂商", { exact: true })).toHaveCount(0);
});

test("login enters dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "登录管理后台" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("service wizards have no service templates and mail keeps its dedicated credential flow", async ({ page }) => {
  await page.goto("/services/new");
  for (const serviceType of ["MCP 服务", "API 服务", "邮箱服务"]) {
    await page.goto("/services/new");
    await page.getByRole("button", { name: new RegExp(serviceType) }).click();
    await expect(page.getByTestId("wizard-title")).toContainText("基本信息");
    await expect(page.getByLabel("服务模板")).toHaveCount(0);
    if (serviceType === "邮箱服务") {
      await expect(page.getByText("服务商", { exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "下一步" }).click();
      await expect(page.getByTestId("wizard-title")).toContainText("账号与授权码");
      await expect(page.getByLabel("邮箱账号")).toBeVisible();
      await expect(page.getByLabel("邮箱授权码")).toBeVisible();
      await expect(page.getByText("注入方式或认证摘要")).toHaveCount(0);
    } else {
      await page.getByRole("button", { name: "下一步" }).click();
      await page.getByRole("button", { name: "下一步" }).click();
    }
    if (serviceType !== "邮箱服务") {
      await expect(page.getByTestId("wizard-title")).toContainText("认证与凭证");
      await expect(page.getByText("端点调用方认证请在“端点发布”中配置。")).toBeVisible();
    }
  }
});

test("Evernote uses the API built-in connector", async ({ page }) => {
  await page.goto("/services/new");
  await page.getByRole("button", { name: /API 服务/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("radio", { name: /使用内置连接器/ }).check();
  await expect(page.getByText("印象笔记", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("连接与认证");
  await page.getByLabel("服务名称").fill("我的印象笔记");
  await page.getByRole("button", { name: "验证并继续" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("能力发现");
  await expect(page.getByText("已发现 5 项 EDAM 接口能力")).toBeVisible();
});

test("Evernote connection details show API definition summary", async ({ page }) => {
  await page.goto("/services/evernote");
  await page.getByRole("tab", { name: "连接与认证" }).click();
  await expect(page.getByText("使用内置连接器", { exact: true })).toBeVisible();
  await expect(page.getByText("印象笔记", { exact: true })).toBeVisible();
  await expect(page.getByText("NoteStore URL", { exact: true })).toBeVisible();
});

test("capability selection links parent, child and half-selected state", async ({ page }) => {
  await page.goto("/endpoints/new");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  const parent = page.getByLabel("QQ邮箱全选");
  await expect(parent).toBeChecked({ indeterminate: true });
  await parent.check();
  await expect(page.getByText(/已选择 \d+ 项能力/).last()).toBeVisible();
  await page.getByRole("checkbox", { name: /删除邮件/ }).uncheck();
  await expect(parent).toBeChecked({ indeterminate: true });
});

test("mail validation advances to IMAP and mobile expiry uses native controls", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/services/new");
  await page.getByRole("button", { name: /邮箱服务/ }).click();
  await expect(page.getByLabel("服务模板")).toHaveCount(0);
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByLabel("邮箱账号").fill("demo@example.com");
  await page.getByLabel("邮箱授权码").fill("DEMO_AUTH_CODE");
  await page.getByRole("radio", { name: "指定过期日期时间" }).check();
  await expect(page.getByLabel("过期日期")).toHaveAttribute("type", "date");
  await expect(page.getByLabel("过期时间")).toHaveAttribute("type", "time");
  await page.getByRole("button", { name: "验证并继续" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("IMAP");
});
