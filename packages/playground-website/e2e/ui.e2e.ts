import { expect, test } from "@playwright/test";

const host = `http://localhost:5173`;
const ctrlOrCmd = process.platform === "darwin" ? "Meta" : "Control";

test.describe("playground UI tests", () => {
  test.skip(process.platform === "win32", "https://github.com/microsoft/typespec/issues/1223");

  test("compiled http sample", async ({ page }) => {
    await page.goto(host);

    // Click the Samples button to open the drawer
    const samplesButton = page.locator('button[aria-label="Browse samples"]');
    await samplesButton.click();

    // Wait for the drawer to open and click on the HTTP service card
    const httpServiceCard = page.locator("text=HTTP service").first();
    await httpServiceCard.click();

    await expect(page.getByText(`title: Widget Service`)).toBeVisible();
  });

  test("report compilation errors", async ({ page }) => {
    await page.goto(host);
    const typespecEditor = page.locator(".monaco-editor").first();
    await typespecEditor.click();
    await page.keyboard.type("invalid");
    await expect(page.getByText(`No files emitted.`)).toBeVisible();
  });

  test("shared link works", async ({ page }) => {
    // Pass code "op sharedCode(): string;"
    // cspell:disable-next-line
    await page.goto(`${host}/?c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7`);
    await expect(page.getByText(`operationId: sharedCode`)).toBeVisible();
  });

  test("save code with ctrl/cmd+S", async ({ page }) => {
    await page.goto(host);
    const typespecEditor = page.locator(".monaco-editor").first();
    await typespecEditor.click();
    await typespecEditor.pressSequentially("op sharedCode(): string;");
    await Promise.all([
      // It is important to call waitForNavigation before click to set up waiting.
      page.waitForURL(
        // cspell:disable-next-line
        new RegExp(`${host}/\\?.*c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7.*`),
      ),
      page.keyboard.press(`${ctrlOrCmd}+KeyS`),
    ]);
  });
});
