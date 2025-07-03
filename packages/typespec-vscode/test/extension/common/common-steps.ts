import { Key, keyboard } from "@nut-tree-fork/nut-js";
import { rm } from "fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Locator, Page } from "playwright";
import { retry, screenshot, sleep } from "./utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesPath = path.resolve(__dirname, "../../images-linux");

/**
 * Before comparing the results, you need to check whether the conditions for result comparison are met.
 * @param page vscode object
 * @param text The text in which the element appears
 * @param errorMessage Error message when element does not appear
 * @param [count, sleep] count: Retry times, sleep: Sleep time between retries
 */
async function preContrastResult(
  page: Page,
  text: string,
  errorMessage: string,
  [count, sleep]: number[] = [10, 5],
) {
  await retry(
    page,
    count,
    async () => {
      const contrastResult = page.getByText(new RegExp(text)).first();
      return (await contrastResult.count()) > 0;
    },
    errorMessage,
    sleep,
  );
}

/**
 * Results comparison
 * @param res List of expected files
 * @param dir The directory to be compared needs to be converted into an absolute path using path.resolve
 */
async function contrastResult(page: Page, res: string[], dir: string) {
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
 * @param {folderName, command}
 * folderName: The text in the top input box is usually the current open root directory,
 * command: After the top input box pops up, the command to be executed
 */
async function startWithCommandPalette(
  page: Page,
  { folderName, command }: { folderName: string; command: string },
) {
  await sleep(2);
  await page.locator("li").filter({ hasText: folderName }).first().click();
  await sleep(2);
  await screenshot(page, "linux", "open_top_panel");
  await page
    .getByRole("textbox", { name: "Search files by name (append" })
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
 * In vscode, when you need to select a folder or a file, call this method
 * @param file When selecting a file, just pass it in. If you need to select a folder, you do not need to pass this parameter in.
 */
async function selectFolder(page: Page, file: string = "") {
  await sleep(10);
  await keyboard.type(file);
  await screenshot(page, "linux", "select_folder");
  await keyboard.pressKey(Key.Enter);
  await keyboard.releaseKey(Key.Enter);
  await sleep(3);
}

/**
 * If the current folder is not empty, sometimes a pop-up will appear
 * asking "Do you want to continue selecting the current folder as the root directory?".
 * In this method, select "yes" because selecting "no" does not make sense.
 * @param page vscode object
 */
async function notEmptyFolderContinue(page: Page) {
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
 * Install plugins using the command
 */
async function installExtensionForCommand(page: Page, extensionDir: string) {
  const findVsix = () => {
    const dir = path.resolve(__dirname, "../../../");
    const files = fs.readdirSync(dir);
    const match = files.find((f) => /^typespec-vscode-.*\.vsix$/.test(f));
    if (!match) throw new Error("No typespec-vscode-*.vsix file found");
    return path.join(dir, match);
  };
  const vsixPath = process.env.VSIX_PATH || findVsix();
  await sleep(5);
  await page.keyboard.press("Control+Backquote");
  await screenshot(page, "linux", "open_terminal");
  await retry(
    page,
    10,
    async () => {
      const cmd = page.getByRole("textbox", { name: /Terminal/ }).first();
      return (await cmd.count()) > 0;
    },
    "Failed to find command palette",
    3,
  );
  const cmd = page.getByRole("textbox", { name: /Terminal/ }).first();
  await cmd.click();
  await sleep(5);
  await cmd.fill(`code --install-extension ${vsixPath} --extensions-dir ${extensionDir}`);
  await screenshot(page, "linux", "start_install_extension");
  await page.keyboard.press("Enter");
  await sleep(8);
  await page
    .getByRole("tab", { name: /Extensions/ })
    .locator("a")
    .click();
  await sleep(2);
  await retry(
    page,
    2,
    async () => {
      // Check if there is Typespec in the title name under the 'installed' section
      const installed = await page
        .locator(".monaco-list > .monaco-scrollable-element")
        .first()
        .getByLabel("TypeSpec")
        .locator("div")
        .filter({ hasText: "TypeSpec" })
        .first()
        .locator("span")
        .first()
        .textContent();
      return installed !== null && installed.includes("TypeSpec");
    },
    `Failed to install the extension.`,
    1,
  );
  await page.getByLabel("Explorer").first().click();
  await screenshot(page, "linux", "install_extension_result");
}

async function closeVscode() {
  await keyboard.pressKey(Key.LeftAlt, Key.F4);
  await keyboard.releaseKey(Key.LeftAlt, Key.F4);
}

/**
 * If the current scenario is: the folder is not empty, you need to call this method
 * @param page vscode project
 * @param folderName The name of the folder that needs to be selected.
 */
function createTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt");
  fs.writeFileSync(filePath, "test");
}

/**
 * Placeholder file, need to be deleted
 * @param folderName The name of the folder that needs to be selected.
 */
function deleteTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt");
  fs.rmSync(filePath);
}

export {
  closeVscode,
  contrastResult,
  createTestFile,
  deleteTestFile,
  installExtensionForCommand,
  notEmptyFolderContinue,
  preContrastResult,
  selectFolder,
  startWithCommandPalette,
};
