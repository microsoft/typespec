import { rm } from "fs/promises";
import fs from "node:fs";
import path from "node:path";
import { Locator, Page } from "playwright";
import { CaseScreenshot, imagesPath, retry } from "./utils";

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
export async function contrastResult(page: Page, res: string[], dir: string, cs: CaseScreenshot) {
  let resLength = 0;
  if (fs.existsSync(dir)) {
    resLength = fs.readdirSync(dir).length;
    await rm(imagesPath, { recursive: true });
  }
  if (resLength !== res.length) {
    await cs.screenshot(page, "error");
    throw new Error("Failed to matches all files");
  }
}

/**
 * All cases need to execute the steps. Click the top input box and enter the command
 * @param page vscode object
 * @param command After the top input box pops up, the command to be executed
 */
export async function startWithCommandPalette(page: Page, command: string, cs: CaseScreenshot) {
  await page.waitForSelector(".explorer-viewlet");
  await page.waitForSelector(".left-items");
  await page.keyboard.press("ControlOrMeta+Shift+P");
  await page.waitForSelector('input[aria-label="Type the name of a command to run."]', {
    state: "visible",
  });
  await cs.screenshot(page, "open_top_panel");
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
    1,
    cs,
  );
  await cs.screenshot(page, "input_command");
  await listForCreate!.click();
}

/**
 * Start the Project with Right click on the file
 * @param page vscode object
 * @param command create, emit or import
 * @param type specify whether the click is on file, folder or empty folder
 * command: specify which command to execute to the project
 */
export async function startWithRightClick(page: Page, command: string, cs: CaseScreenshot) {
  await page.waitForSelector(".explorer-viewlet");
  await page.waitForSelector(".letterpress");
  await page.waitForSelector(".left-items");
  const targetName = "ImportTypespecProjectEmptyFolder";
  await page.getByRole("toolbar", { name: "Explorer actions" }).click();
  const target = page.getByRole("treeitem", { name: targetName }).locator("a");
  await target.click({ button: "right" });
  await retry(
    page,
    10,
    async () => {
      const ImportBtn = page.getByRole("menuitem", { name: "Import TypeSpec from OpenAPI" });
      return (await ImportBtn.count()) > 0;
    },
    "Failed to locate ImportBtn successfully",
    2,
    cs,
  );
  await page.getByRole("menuitem", { name: "Import TypeSpec from OpenAPI" }).click();
  await cs.screenshot(page, "import_typespec");
}

/**
 * Wait for the installation dependency pop-up to appear and confirm that the specified package checkbox and OK button have been rendered.
 * @param page Playwright Page object, representing the current VSCode page
 * @param packagePattern Regular expression used to match package checkbox
 * @returns Promise<void> Resolve when both the OK button and the specified package checkbox appear, otherwise throw an exception after multiple retries
 */
async function waitForInstallDialog(page: Page, packagePattern: RegExp, cs: CaseScreenshot) {
  await retry(
    page,
    10,
    async () => {
      const okBtn = page.getByRole("button", { name: "OK" });
      const packageList = page.getByRole("checkbox", { name: packagePattern });
      return (await okBtn.count()) > 0 && (await packageList.count()) > 0;
    },
    "Failed to locate okBtn and package list successfully",
    3,
    cs,
  );
}

/**
 * A UI will pop up to check packages to be installed. Call this method to select
 * @param page vscode project
 * @param operation in which scenario is it called (EmitTypeSpec, ImportTypeSpec)
 **/
export async function InstallPackages(page: Page, operation: string, cs: CaseScreenshot) {
  if (operation === "EmitTypeSpec") {
    await waitForInstallDialog(page, /@typespec\/http-client-python/, cs);
    await page.getByRole("button", { name: /OK/ }).click();
  } else if (operation === "ImportTypeSpec") {
    await page
      .getByRole("option", { name: "Install @typespec/openapi3," })
      .locator("label")
      .click();
  }
  await cs.screenshot(page, "install_packages.png");
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

/**
 * Remove the "devDependencies" section from package.json and add specific dependencies.
 * @param folderName The folder containing the package.json file.
 */
export function preparePackageJson(folderName: string) {
  const filePath = path.join(folderName, "package.json");
  const content = fs.readFileSync(filePath, "utf-8");
  const pkg = JSON.parse(content);

  // Remove devDependencies
  delete pkg.devDependencies;

  // Add required devDependencies
  pkg.devDependencies = {
    "@typespec/compiler": "~1.2.1",
    "@typespec/internal-build-utils": "~0.72.1",
  };

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2), "utf-8");
}
