import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import {
  contrastResult,
  preContrastResult,
  startWithRightClick,
  tryInstallAndHandle,
} from "./common/common-steps";
import { mockShowOpenDialog } from "./common/mock-dialogs";
import { CaseScreenshot, tempDir, test, testfilesDir } from "./common/utils";

// Test files are copied into the temporary directory before tests run
beforeAll(async () => {
  const src = path.resolve(testfilesDir, "ImportTypespecProjectOpenApi3");
  const dest = path.resolve(tempDir, "ImportTypespecProjectOpenApi3");
  fs.cpSync(src, dest, { recursive: true });
}, 300000);

let shouldSkip = false;

shouldSkip = tryInstallAndHandle("@typespec/http") || shouldSkip;
shouldSkip = tryInstallAndHandle("@typespec/openapi3") || shouldSkip;

enum ImportProjectTriggerType {
  CommandPalette = "CommandPalette",
  RightClickOnFile = "RightClickOnFile",
  RightClickOnFolder = "RightClickOnFolder",
}

type ImportConfigType = {
  caseName: string;
  triggerType: ImportProjectTriggerType;
  selectFolderEmptyOrNonEmpty: string;
  expectedResults: string[];
};

const ImportTypespecProjectFolderPath = path.resolve(tempDir, "ImportTypespecProjectOpenApi3");
const ImportTypespecProjectEmptyFolderPath = path.resolve(
  tempDir,
  "ImportTypespecProjectOpenApi3/ImportTypespecProjectEmptyFolder",
);

const ImportCasesConfigList: ImportConfigType[] = [];

ImportCasesConfigList.push({
  caseName: "ImportTypespecProject Trigger RightClickOnFolder EmptyFolder",
  triggerType: ImportProjectTriggerType.RightClickOnFolder,
  selectFolderEmptyOrNonEmpty: "empty",
  expectedResults: ["openapi.3.0.yaml", "ImportTypespecProjectEmptyFolder"],
});

beforeEach(() => {
  const importTypespec = ImportTypespecProjectFolderPath;
  const importTypespecEmptyFolder = ImportTypespecProjectEmptyFolderPath;
  if (fs.existsSync(importTypespec)) {
    let hasOpenapi3File = false;
    for (const file of fs.readdirSync(importTypespec)) {
      if (file === "openapi.3.0.yaml") {
        hasOpenapi3File = true;
      } else if (file !== "ImportTypespecProjectEmptyFolder") {
        const filePath = path.resolve(importTypespec, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
    if (!hasOpenapi3File) {
      throw new Error("Failed to find openapi3 file");
    }
  } else {
    throw new Error("Failed to find ImportTypespecProjectOpenApi3 directory");
  }
  if (fs.existsSync(importTypespecEmptyFolder)) {
    for (const file of fs.readdirSync(importTypespecEmptyFolder)) {
      const filePath = path.resolve(importTypespecEmptyFolder, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } else if (!fs.existsSync(importTypespecEmptyFolder)) {
    fs.mkdirSync(importTypespecEmptyFolder, { recursive: true });
  }
});

afterAll(() => {
  try {
    execSync("pnpm uninstall @typespec/http", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
  try {
    execSync("pnpm uninstall @typespec/openapi3", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
  try {
    execSync("git restore ./../../pnpm-lock.yaml", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
});

const describeFn = shouldSkip ? describe.skip : describe;
describeFn.each(ImportCasesConfigList)("ImportTypespecFromOpenApi3", async (item) => {
  const { caseName, expectedResults } = item;
  test(caseName, async ({ launch }) => {
    const cs = new CaseScreenshot(caseName);
    const workspacePath = ImportTypespecProjectFolderPath;

    const { page, app } = await launch({
      workspacePath,
    });
    const openapifilepath = path.resolve(ImportTypespecProjectFolderPath, "openapi.3.0.yaml");
    await mockShowOpenDialog(app, [openapifilepath]);
    await startWithRightClick(page, "Import TypeSpec from Openapi 3", cs);

    await preContrastResult(
      page,
      "Importing from OpenAPI succeeded.",
      "Failed to Import project Successful",
      150000,
      cs,
      app,
    );
    await contrastResult(expectedResults, workspacePath, cs);
    app.close();
  });
});
