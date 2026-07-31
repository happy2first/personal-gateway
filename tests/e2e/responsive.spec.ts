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
  const action = page.getByRole("button", { name: /下一步|保存/ });
  const ready = done.or(action);
  for (let index = 0; index < 10; index += 1) {
    await expect(ready).toBeVisible();
    if (await done.isVisible()) break;
    await action.click();
  }
  await expect(done).toBeVisible();
});

test("login enters dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("密码").fill("demo");
  await page.getByRole("button", { name: "登录管理后台" }).click();
  await expect(page).toHaveURL(/dashboard/);
});
