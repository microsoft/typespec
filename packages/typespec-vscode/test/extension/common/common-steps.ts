import { rm } from "fs/promises";
import fs from "node:fs";
import path from "node:path";
import { Locator, Page } from "playwright";
import { imagesPath, retry, screenshot } from "./utils";

/**
 * Waits for the specified text to appear on the page before proceeding.
 * @param page The Playwright Page object representing the current browser page.
 * @param text The text content to wait for on the page.
 * @param errorMessage The error message to throw if the text does not appear within the timeout.
 * @param timeout The maximum time (in milliseconds) to wait for the text to appear. Default is 10 seconds.
 */
export async function preContrastResult(
  page: Page,
  text: string,
  errorMessage: string,
  timeout: number = 10000,
) {
  try {
    await page.waitForSelector(`:text("${text}")`, { timeout });
  } catch (e) {
    throw new Error(errorMessage);
  }
}

/**
 * Results comparison
 * @param res List of expected files
 * @param dir The directory to be compared needs to be converted into an absolute path using path.resolve
 */
export async function contrastResult(page: Page, res: string[], dir: string) {
  let resLength = 0;
  if (fs.existsSync(dir)) {
    resLength = fs.readdirSync(dir).length;
    await rm(imagesPath, { recursive: true });
  }
  if (resLength !== res.length) {
    await screenshot(page, "linux", "error");
    throw new Error("Failed to matches all files");
  }
}

/**
 * All cases need to execute the steps. Click the top input box and enter the command
 * @param page vscode object
 * @param command After the top input box pops up, the command to be executed
 */
export async function startWithCommandPalette(page: Page, command: string) {
  await page.keyboard.press("ControlOrMeta+Shift+P");
  await page.waitForSelector('input[aria-label="Type the name of a command to run."]', {
    state: "visible",
  });
  await screenshot(page, "linux", "open_top_panel");
  await page
    .getByRole("textbox", { name: "Type the name of a command to run." })
    .first()
    .fill(`>TypeSpec: ${command}`);
  let listForCreate: Locator;
  await retry(
    page,
    5,
    async () => {
      listForCreate = page
        .locator("a")
        .filter({ hasText: `TypeSpec: ${command}` })
        .first();
      return (await listForCreate.count()) > 0;
    },
    "Failed to find the specified option",
  );
  await screenshot(page, "linux", "input_command");
  await listForCreate!.click();
}

/**
 * If the current folder is not empty, sometimes a pop-up will appear
 * asking "Do you want to continue selecting the current folder as the root directory?".
 * In this method, select "yes" because selecting "no" does not make sense.
 * @param page vscode object
 */
export async function notEmptyFolderContinue(page: Page) {
  let yesBtn: Locator;
  await retry(
    page,
    5,
    async () => {
      yesBtn = page
        .getByRole("option", { name: "Yes" })
        .locator("label")
        .filter({ hasText: "Yes" })
        .first();
      const noBtn = page
        .getByRole("option", { name: "No" })
        .locator("label")
        .filter({ hasText: "No" })
        .first();
      return (await yesBtn.count()) > 0 && (await noBtn.count()) > 0;
    },
    "Failed to find yes/no button",
    1,
  );
  await retry(
    page,
    5,
    async () => {
      const yesdescriptionBox = page.getByRole("option", { name: "Yes" }).locator("label");
      const yesdescriptionText = await yesdescriptionBox.textContent();
      return yesdescriptionText !== null && yesdescriptionText.includes("YesSelected folder");
    },
    "Failed to match the description for the non-empty folder cases",
    1,
  );
  await screenshot(page, "linux", "not_empty_folder_continue");
  await yesBtn!.click();
}

/**
 * If the current scenario is: the folder is not empty, you need to call this method
 * @param page vscode project
 * @param folderName The name of the folder that needs to be selected.
 */
export function createTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt");
  fs.writeFileSync(filePath, "test");
}

/**
 * Placeholder file, need to be deleted
 * @param folderName The name of the folder that needs to be selected.
 */
export function deleteTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt");
  fs.rmSync(filePath);
}
