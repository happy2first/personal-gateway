import { expect, test } from "@playwright/test";

test("all primary pages are reachable and do not overflow", async ({ page }) => {
  const paths = ["/login", "/dashboard", "/tools", "/tools/new-rest", "/tools/import-openapi", "/tools/import-mcp", "/tools/mail-search", "/connections", "/connections/new", "/connections/qq-mail", "/publications", "/publications/new", "/publications/personal-mcp", "/clients", "/clients/new", "/clients/chatgpt", "/grants", "/logs", "/logs/req-9f2a", "/security-events", "/alerts", "/settings"];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, `${path} has horizontal overflow`).toBe(false);
  }
});

test("REST Tool wizard is clickable", async ({ page }) => {
  await page.goto("/tools/new-rest");
  const done = page.getByText("流程已完成");
  const action = page.getByRole("button", { name: /下一步|保\s*存/ });
  for (let index = 0; index < 10; index += 1) {
    if (await done.isVisible()) break;
    await expect(action).toBeVisible();
    await action.click();
  }
  await expect(done).toBeVisible();
});

test("mobile wizard advances visibly without covering test input", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tools/new-rest");

  const title = page.getByTestId("wizard-step-title");
  const next = page.getByRole("button", { name: "下一步" });
  await expect(title).toContainText("基本信息");

  for (const expected of ["Connection", "参数映射", "Schema", "风险", "测试"]) {
    await next.click();
    await expect(title).toContainText(expected);
  }

  const testInput = page.getByLabel("测试参数");
  const actions = page.getByTestId("wizard-actions");
  await actions.scrollIntoViewIfNeeded();
  const [inputBox, actionsBox] = await Promise.all([testInput.boundingBox(), actions.boundingBox()]);
  expect(inputBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(actionsBox!.y + 1);
});

test("login enters dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("密码").fill("demo");
  await page.getByRole("button", { name: "登录管理后台" }).click();
  await expect(page).toHaveURL(/dashboard/);
});
