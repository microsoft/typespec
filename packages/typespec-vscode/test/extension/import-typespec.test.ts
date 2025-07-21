import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  contrastResult,
  notEmptyFolderContinue,
  preContrastResult,
  selectFolder,
  startWithCommandPalette,
  startWithRightClick,
} from "./common/common-steps";
import { screenshot, tempDir, test } from "./common/utils";

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

ImportCasesConfigList.push(
  {
    caseName: "ImportTypespecProject-CommandPalette-EmptyFolder",
    triggerType: ImportProjectTriggerType.CommandPalette,
    selectFolderEmptyOrNonEmpty: "empty",
    expectedResults: ["openapi.3.0.yaml", "ImportTypespecProjectEmptyFolder"],
  },
  {
    caseName: "ImportTypespecProject-RightClickOnFile-NonEmptyFolder",
    triggerType: ImportProjectTriggerType.RightClickOnFile,
    selectFolderEmptyOrNonEmpty: "non-empty",
    expectedResults: ["openapi.3.0.yaml", "main.tsp", "ImportTypespecProjectEmptyFolder"],
  },
  {
    caseName: "ImportTypespecProject-RightClickOnFolder-EmptyFolder",
    triggerType: ImportProjectTriggerType.RightClickOnFolder,
    selectFolderEmptyOrNonEmpty: "empty",
    expectedResults: ["openapi.3.0.yaml", "ImportTypespecProjectEmptyFolder"],
  },
);

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
  const { caseName, triggerType, selectFolderEmptyOrNonEmpty, expectedResults } = item;
  test(caseName, async ({ launch }) => {
    const workspacePath = ImportTypespecProjectFolderPath;

    const { page, app } = await launch({
      workspacePath,
    });

    if (triggerType === "CommandPalette") {
      await startWithCommandPalette(page, "Import Typespec from Openapi 3");
    } else if (triggerType === "RightClickOnFile") {
      await startWithRightClick(page, "Import TypeSpec from Openapi 3", "file");
    } else if (triggerType === "RightClickOnFolder" && selectFolderEmptyOrNonEmpty === "empty") {
      await startWithRightClick(page, "Import TypeSpec from Openapi 3", "emptyfolder");
    }

    if (selectFolderEmptyOrNonEmpty === "empty" && triggerType !== "RightClickOnFolder") {
      await selectFolder("ImportTypespecProjectEmptyFolder");
      await selectFolder();
    } else if (selectFolderEmptyOrNonEmpty === "non-empty") {
      await selectFolder();
      await notEmptyFolderContinue(page);
    }

    await selectFolder("openapi.3.0.yaml");
    await screenshot(page, "linux", "result_list.png");

    await preContrastResult(
      page,
      "OpenAPI succeeded",
      "Failed to import project successfully",
      150000,
    );
    app.close();
    await contrastResult(page, expectedResults, workspacePath);
  });
});
