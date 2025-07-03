import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe } from "vitest";
import {
  closeVscode,
  contrastResult,
  createTestFile,
  deleteTestFile,
  installExtensionForCommand,
  notEmptyFolderContinue,
  preContrastResult,
  selectFolder,
  startWithCommandPalette,
} from "./common/common-steps";
import {
  inputProjectName,
  selectEmitters,
  selectTemplate,
  startWithClick,
} from "./common/create-steps";
import { test } from "./common/utils";
import {
  CreateCasesConfigList,
  CreateProjectTriggerType,
  CreateTypespecProjectFolder,
} from "./config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeEach(() => {
  const dir = path.resolve(__dirname, CreateTypespecProjectFolder);
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.resolve(dir, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
});

describe.each(CreateCasesConfigList)("CreateTypespecProject-cases", async (item) => {
  const {
    caseName,
    triggerType,
    templateName,
    templateNameDescription,
    isEmptyFolder,
    expectedResults,
  } = item;

  test(caseName, async ({ launch }) => {
    const workspacePath = path.resolve(__dirname, CreateTypespecProjectFolder);
    const { page, extensionDir } = await launch({
      workspacePath: triggerType === CreateProjectTriggerType.Command ? workspacePath : "test",
    });

    if (!isEmptyFolder) {
      createTestFile(workspacePath);
    }

    await installExtensionForCommand(page, extensionDir);

    if (triggerType === CreateProjectTriggerType.Command) {
      await startWithCommandPalette(page, {
        folderName: CreateTypespecProjectFolder,
        command: "Create Typespec Project",
      });
    } else {
      await startWithClick(page);
    }

    await selectFolder(page, triggerType === CreateProjectTriggerType.Command ? "" : workspacePath);

    if (!isEmptyFolder) {
      await notEmptyFolderContinue(page);
      deleteTestFile(workspacePath);
    }

    await selectTemplate(page, templateName, templateNameDescription);

    await inputProjectName(page);

    if (templateName === "Generic Rest API") {
      await selectEmitters(page);
    }

    await preContrastResult(
      page,
      "Project created",
      "Failed to create project Successful",
      [10, 15],
    );
    await closeVscode();
    await contrastResult(page, expectedResults, workspacePath);
  });
});
