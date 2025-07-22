import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  startWithRightClick,
} from "./common/common-steps";
import { mockShowOpenDialog } from "./common/mock-dialogs";
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
  const { caseName } = item;
  test(caseName, async ({ launch }) => {
    const workspacePath = ImportTypespecProjectFolderPath;

    const { page, app } = await launch({
      workspacePath,
    });

    const openapifilepath = path.resolve(ImportTypespecProjectFolderPath, "openapi.3.0.yaml")
    await mockShowOpenDialog(app, [openapifilepath]);
    await startWithRightClick(page, "Import TypeSpec from Openapi 3");
    await screenshot(page, "linux", "result_list.png");

    app.close();
  });
});
