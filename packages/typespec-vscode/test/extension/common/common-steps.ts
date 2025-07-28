import fs from "node:fs";
import path from "node:path";
import { Locator, Page } from "playwright";
import { retry, screenshot } from "./utils";

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
  } catch (e) {}
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
 * If the current folder is not empty, sometimes a pop-up will appear
 * asking "Do you want to continue selecting the current folder as the root directory?".
 * In this method, select "yes" because selecting "no" does not make sense.
 * @param page vscode object
 */
export async function notEmptyFolderContinue(page: Page) {
  try {
    await page.waitForSelector('role=option[name="No"] >> label:has-text("No")', { timeout: 5000 });
    await page.waitForSelector('role=option >> label:has-text("Yes")', { timeout: 5000 });
  } catch (e) {
    throw new Error(e as string);
  }
  try {
    await page.waitForSelector(`:text("YesSelected folder")`, { timeout: 5000 });
  } catch (e) {
    throw new Error("Failed to match the description for the non-empty folder cases");
  }
  await screenshot(page, "linux", "not_empty_folder_continue");
  await page.waitForSelector('a:has-text("Yes")');
  await page.getByRole("option", { name: /Yes/ }).locator("a").filter({ hasText: /Yes/ }).click();
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

/**
 * Tspconfig file, need to be deleted when needed
 * @param folderName The name of the folder that needs to be selected.
 */
export function deleteTspConfigFile(folderName: string) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  fs.rmSync(filePath);
}

/**
 * Tspconfig file, need to be created
 * @param folderName The name of the folder that needs to be selected.
 */
export function createTspConfigFile(folderName: string) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  const file_content = `emit:
  - "@typespec/openapi3"
  - "@typespec/http-client-python"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{output-dir}/{emitter-name}"
  "@typespec/http-client-python":
    emitter-output-dir: "{output-dir}/{emitter-name}"
`;
  fs.writeFileSync(filePath, file_content);
}
