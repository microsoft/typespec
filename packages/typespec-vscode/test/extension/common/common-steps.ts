import { readdirSync } from "fs";
import { rm } from "fs/promises";
import fs, { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Locator, Page } from "playwright";
import { RunOptions, runOrExit } from "../../../../internal-build-utils/dist/src/index.js";
import { CaseScreenshot, npxCmd, repoRoot, retry, tempDir } from "./utils";

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
  cs: CaseScreenshot,
  app?: any,
) {
  try {
    await page.waitForSelector(`:text("${text}")`, { timeout });
  } catch (e) {
    await cs.screenshot(page, "error");
    app.close();
    throw new Error(errorMessage);
  }
}

/**
 * Results comparison
 * @param res List of expected files
 * @param dir The directory to be compared needs to be converted into an absolute path using path.resolve
 */
export async function contrastResult(res: string[], dir: string, cs: CaseScreenshot) {
  let resLength = 0;
  if (fs.existsSync(dir)) {
    resLength = fs.readdirSync(dir).length;
    await rm(cs.caseDir, { recursive: true });
  }
  if (resLength !== res.length) {
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
  if (command.includes("Emit")) {
    await cs.screenshot(page, "trigger_emit_typespec");
  } else {
    await cs.screenshot(page, "trigger_create_typespec");
  }
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
  await cs.screenshot(page, "trigger_import_typespec");
  await page.getByRole("menuitem", { name: "Import TypeSpec from OpenAPI" }).click();
}

/**
 * Tspconfig file, read and delete the first three lines
 * @param folderName The name of the folder that needs to be selected.
 */
export function readTspConfigFile(folderName: string) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const newLines = lines.slice(3);
  fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
  return { content, newLines };
}

/**
 * Add the deleted three lines back to the beginning of the tspconfig.yaml file.
 * @param folderName The folder name that needs to be operated on.
 * @param content The full content to restore into tspconfig.yaml.
 */
export function restoreTspConfigFile(folderName: string, lines: string) {
  const filePath = path.join(folderName, "tspconfig.yaml");
  fs.writeFileSync(filePath, lines, "utf-8");
}

/**
 * Pack those packages in the repoRoot needed for testing and prepare to be linked
 * @returns packages path map
 */
export async function packPackages() {
  await runOrExit("pnpm", ["-w", "pack:all"], { cwd: repoRoot, stdio: "ignore" });
  const outputFolder = path.join(repoRoot, "/temp/artifacts");
  const files = readdirSync(outputFolder);

  function resolvePackage(start: string, notStart?: string): string {
    const pkgName = files.find(
      (x: string) => x.startsWith(start) && (!notStart || !x.startsWith(notStart)),
    );
    if (pkgName === undefined) {
      throw new Error(`Cannot resolve package starting with "${start}"`);
    }
    return path.join(outputFolder, pkgName);
  }

  return {
    "@typespec/compiler": resolvePackage("typespec-compiler-"),
    "@typespec/openapi3": resolvePackage("typespec-openapi3-"),
    "@typespec/http": resolvePackage("typespec-http-"),
    "@typespec/http-client": resolvePackage("typespec-http-client-", "typespec-http-client-js-"),
    "@typespec/http-client-js": resolvePackage("typespec-http-client-js-"),
    "@typespec/streams": resolvePackage("typespec-streams-"),
    "@typespec/rest": resolvePackage("typespec-rest-"),
    "@typespec/emitter-framework": resolvePackage("typespec-emitter-framework-"),
    "@typespec/openapi": resolvePackage("typespec-openapi-"),
  };
}

/**
 * Install those packages needed for testing in the EmitTypespecProject folder
 * @param packages packages path map
 */
export async function packagesInstall(packages: { [x: string]: string }, testType: string) {
  let testCurrentDir: string;
  if (testType === "Emit") {
    testCurrentDir = path.join(tempDir, "EmitTypespecProject");
    const outputDir = path.join(testCurrentDir, "tsp-output");
    rmSync(outputDir, { recursive: true, force: true });
  } else if (testType === "Import") {
    testCurrentDir = path.join(tempDir, "ImportTypespecProjectOpenApi3");
  } else if (testType === "Preview") {
    testCurrentDir = path.join(tempDir, "PreviewTypespecProject");
  } else {
    throw new Error(`Unknown testType: ${testType}`);
  }
  const packageJson = {
    name: "@typespec/e2e-test-typespec-vscode",
    dependencies: {
      "@typespec/compiler": packages["@typespec/compiler"],
      "@typespec/http": packages["@typespec/http"],
      "@typespec/openapi3": packages["@typespec/openapi3"],
      "@typespec/http-client-js": packages["@typespec/http-client-js"],
      "@typespec/streams": packages["@typespec/streams"],
      "@typespec/rest": packages["@typespec/rest"],
      "@typespec/emitter-framework": packages["@typespec/emitter-framework"],
      "@typespec/openapi": packages["@typespec/openapi"],
    },
    private: true,
    overrides: {
      // override to make sure to use local http-client package, otherwise it will be installed from npm registry and may
      // cause issues from different version (i.e. multiple version alloy libraries being complained)
      "@typespec/http-client": packages["@typespec/http-client"],
    },
  };
  writeFileSync(path.join(testCurrentDir, "package.json"), JSON.stringify(packageJson, null, 2));

  await runTypeSpec(packages["@typespec/compiler"], ["install"], { cwd: testCurrentDir });
  await runTypeSpec(packages["@typespec/http"], ["install"], { cwd: testCurrentDir });
  await runTypeSpec(packages["@typespec/openapi3"], ["install"], { cwd: testCurrentDir });
  await runTypeSpec(packages["@typespec/http-client-js"], ["install"], { cwd: testCurrentDir });
}

/**
 * Run typespec with npx
 * @param compilerTgz The path to the TypeSpec compiler package tarball.
 * @param args The arguments to pass to the TypeSpec compiler.
 * @param options Additional options for running the command.
 */
export async function runTypeSpec(compilerTgz: string, args: any, options: RunOptions | undefined) {
  await runOrExit(npxCmd, ["-y", "-p", compilerTgz, "tsp", ...args], { ...options });
}
