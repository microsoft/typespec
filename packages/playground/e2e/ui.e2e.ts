import { expect, test } from "@playwright/test";

const host = `http://localhost:5173`;
const ctrlOrCmd = process.platform === "darwin" ? "Meta" : "Control";

test.describe("playground UI tests", () => {
  test.skip(process.platform === "win32", "https://github.com/microsoft/cadl/issues/1223");

  test("compiled http sample", async ({ page }) => {
    await page.goto(host);
    const samplesDropDown = page.locator("_react=SamplesDropdown").locator("select");
    await samplesDropDown.selectOption({ label: "HTTP service" });
    const outputContainer = page.locator("_react=OutputContent");
    await expect(outputContainer).toContainText(`title: Widget Service`);
  });

  test("shared link works", async ({ page }) => {
    // Pass code "op sharedCode(): string;"
    // cspell:disable-next-line
    await page.goto(`${host}/?c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7`);
    const outputContainer = page.locator("_react=OutputContent");
    await expect(outputContainer).toContainText(`operationId: sharedCode`);
  });

  test("save code with ctrl/cmd+S", async ({ page }) => {
    await page.goto(host);
    const cadlEditorContainer = page.locator("_react=CadlEditor");
    await cadlEditorContainer.click();
    await cadlEditorContainer.type("op sharedCode(): string;");
    await Promise.all([
      // It is important to call waitForNavigation before click to set up waiting.
      // cspell:disable-next-line
      page.waitForNavigation({ url: `${host}/?c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7` }),
      page.keyboard.press(`${ctrlOrCmd}+KeyS`),
    ]);
  });
});
