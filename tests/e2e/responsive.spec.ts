import { expect, test } from "@playwright/test";

const routes = ["/login", "/dashboard", "/services", "/services/new", "/services/qq-mail", "/endpoints", "/endpoints/new", "/endpoints/personal-readonly", "/calls", "/calls/req-a91f", "/settings"];

test("all routes render without page overflow", async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), path + " overflows").toBe(false);
  }
});

test("dashboard contains requested operational overview", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByText("凭证将在 5 天后到期")).toBeVisible();
  await expect(page.getByText("服务当前可用情况")).toBeVisible();
  await expect(page.getByText("端点当前可用情况")).toBeVisible();
  for (const title of ["端点调用趋势", "服务调用分布", "端点调用分布", "高危能力调用趋势", "高危能力调用分布"]) await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText("最近调用", { exact: true })).toHaveCount(0);
  if (testInfo.project.name === "mobile-375") await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });
});

test("service wizard keeps footer fixed and removes generated fields", async ({ page }, testInfo) => {
  await page.goto("/services/new");
  await page.getByRole("button", { name: /MCP 服务/ }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("基本信息");
  await expect(page.getByText("API 转 MCP")).toHaveCount(0);
  await expect(page.getByLabel("服务标识")).toHaveCount(0);
  await expect(page.getByLabel("分类")).toHaveCount(0);
  const actionBox = await page.getByTestId("wizard-actions").boundingBox();
  expect(actionBox).not.toBeNull();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("地址与传输");
  if (testInfo.project.name === "mobile-375") await page.screenshot({ path: testInfo.outputPath("service-wizard-mobile.png") });
});

test("endpoint wizard merges caller and permissions and preserves tree state", async ({ page }) => {
  await page.goto("/endpoints/new");
  await expect(page.getByRole("button", { name: /返\s*回/ })).toBeVisible();
  await expect(page.getByLabel("端点标识")).toHaveCount(0);
  await expect(page.getByLabel("AI 厂商")).toHaveCount(0);
  await expect(page.getByLabel("调用方名称")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("发布协议");
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("服务与能力");
  await page.getByText("QQ邮箱", { exact: true }).click();
  await expect(page.getByText("搜索邮件", { exact: true })).toBeVisible();
  await page.getByRole("checkbox").first().click();
  await expect(page.getByText("搜索邮件", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("wizard-title")).toContainText("能力转换");
});

test("detail tables scroll internally and edit actions stay disabled", async ({ page }, testInfo) => {
  for (const path of ["/services/qq-mail", "/endpoints/personal-readonly"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "编辑（暂不可用）" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  }
  await page.getByRole("tab", { name: "认证" }).click();
  await expect(page.getByRole("button", { name: "重新生成令牌" })).toBeVisible();
  await expect(page.getByText("2026-10-30 23:59")).toBeVisible();
  if (testInfo.project.name === "mobile-375") await page.screenshot({ path: testInfo.outputPath("endpoint-detail-mobile.png") });
});

test("settings exposes notification rules and password change", async ({ page }, testInfo) => {
  await page.goto("/settings");
  for (const text of ["到期通知", "提前通知天数", "非常用时段端点调用通知", "非常用时段", "高危能力调用通知", "高危能力定义"]) await expect(page.getByText(text, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "修改密码" }).click();
  await expect(page.getByRole("dialog")).toContainText("当前密码");
  await page.getByRole("button", { name: "取消" }).click();
  if (testInfo.project.name === "mobile-375") await page.screenshot({ path: testInfo.outputPath("settings-mobile.png"), fullPage: true });
});

test("login enters dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "登录管理后台" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

