import { expect, test } from "@playwright/test";

test("check compiled http sample", async ({ page }) => {
  await page.goto(`http://localhost:3000`);
  const samplesDropDown = page.locator("select#samples");
  await samplesDropDown.selectOption({ label: "Http" });
  const outputContainer = page.locator("#output");
  await expect(outputContainer).toContainText(`"title": "Widget Service"`);
});
