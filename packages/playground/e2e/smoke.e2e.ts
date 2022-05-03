import { expect, test } from "@playwright/test";

const host = `http://localhost:3000`;
test("compiled http sample", async ({ page }) => {
  await page.goto(host);
  const samplesDropDown = page.locator("select.sample-dropdown");
  await samplesDropDown.selectOption({ label: "Http" });
  const outputContainer = page.locator("#output");
  await expect(outputContainer).toContainText(`"title": "Widget Service"`);
});

test("shared link works", async ({ page }) => {
  // Pass code "op sharedCode(): string;"
  await page.goto(`${host}/?c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7`);
  const outputContainer = page.locator("#output");
  await expect(outputContainer).toContainText(`"operationId": "sharedCode"`);
});
