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
  await page.waitForSelector(".explorer-viewlet");
  await page.waitForSelector(".left-items");
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
 * Start the Project with Right click on the file
 * @param page vscode object
 * @param command create, emit or import
 * @param type specify whether the click is on file, folder or empty folder
 * command: specify which command to execute to the project
 */
export async function startWithRightClick(page: Page, command: string) {
  await page.waitForSelector(".explorer-viewlet");
  await page.waitForSelector(".letterpress");
  await page.waitForSelector(".left-items");
  const targetName = "ImportTypespecProjectEmptyFolder";
  await page.getByRole("toolbar", { name: "Explorer actions" }).click();
  const target = page.getByRole("treeitem", { name: targetName }).locator("a");
  await target.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Import TypeSpec from OpenAPI" }).click();
  await screenshot(page, "linux", "import_typespec");
}

/**
 * A UI will pop up to check packages to be installed. Call this method to select
 * @param page vscode project
 * @param operation in which scenario is it called (EmitTypeSpec, ImportTypeSpec)
 **/
export async function InstallPackages(page: Page, operation: string) {
  if (operation === "EmitTypeSpec"){
    await retry(
      page,
      10,
      async () => {
        const okBtn = page.getByRole('button', { name: 'OK' })
        const packageList = page.getByRole('checkbox', { name: /@typespec\/http-client-python/ });
        return (await okBtn.count()) > 0 && (await packageList.count()) > 0;
      },
      "Failed to locate okBtn and package list successfully",
      3,
    );
  } else if (operation === "ImportTypeSpec") {
    await retry(
      page,
      10,
      async () => {
        const okBtn = page.getByRole('button', { name: 'OK' })
        const packageList = page.getByRole('checkbox', { name: /@typespec\/openapi3/ });
        return (await okBtn.count()) > 0 && (await packageList.count()) > 0;
      },
      "Failed to locate okBtn and package list successfully",
      3,
    );    
  }
  await screenshot(page, "linux", "install_packages.png");
  await page.getByRole("button", { name: /OK/ }).click();
}

/**
 * Tspconfig file, read and delete the first three lines
 * @param folderName The name of the folder that needs to be selected.
 */
export function readTspConfigFile(folderName: string) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const removedLines = lines.slice(0, 3);
  const newLines = lines.slice(3);
  fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
  return { removedLines, newLines };
}

/**
 * Add the deleted three lines back to the beginning of the tspconfig.yaml file.
 * @param folderName The folder name that needs to be operated on.
 * @param lines The three lines of content (array) to be restored for @ param lines.
 */
export function restoreTspConfigFile(folderName: string, lines: string[]) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  const currentContent = fs.readFileSync(filePath, "utf-8");
  const newContent = lines.join("\n") + (currentContent ? "\n" + currentContent : "");
  fs.writeFileSync(filePath, newContent, "utf-8");
}
