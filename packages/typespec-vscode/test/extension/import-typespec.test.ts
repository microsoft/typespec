import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import { contrastResult, preContrastResult, startWithRightClick } from "./common/common-steps";
import { mockShowOpenDialog } from "./common/mock-dialogs";
import { CaseScreenshot, tempDir, test } from "./common/utils";

try {
  execSync("pnpm install @typespec/openapi3", { stdio: "inherit" });
  execSync("pnpm install @typespec/http", { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}

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

describe.each(ImportCasesConfigList)("ImportTypespecFromOpenApi3", async (item) => {
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
    app.close();
    await contrastResult(page, expectedResults, workspacePath, cs);
    try {
      execSync("git restore ./package.json", { stdio: "inherit" });
      execSync("git restore ../../pnpm-lock.yaml", { stdio: "inherit" });
    } catch (e) {
      process.exit(1);
    }
  });
});
