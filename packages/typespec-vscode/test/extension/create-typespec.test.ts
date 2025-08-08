import { mkdir, rm } from "fs/promises";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  contrastResult,
  createTestFile,
  deleteTestFile,
  notEmptyFolderContinue,
  preContrastResult,
  startWithCommandPalette,
} from "./common/common-steps";
import {
  inputProjectName,
  selectEmitters,
  selectTemplate,
  startWithClick,
} from "./common/create-steps";
import { mockShowOpenDialog } from "./common/mock-dialogs";
import { tempDir, test } from "./common/utils";

enum CreateProjectTriggerType {
  Click = "RightClick",
  Command = "CommandPalette",
}

type CreateConfigType = {
  caseName: string;
  triggerType: CreateProjectTriggerType;
  templateName: string;
  templateNameDescription: string;
  isEmptyFolder: boolean;
  expectedResults: string[];
};

const CreateTypespecProjectFolderPath = path.resolve(tempDir, "CreateTypespecProject");

const createCase = "CreateTypespecProject";
const templateName = "Generic Rest API";
const templateNameDescription = "Create a project representing a generic REST API service.";
const expectedResults = [
  ".gitignore",
  "main.tsp",
  "node_modules",
  "package-lock.json",
  "package.json",
  "tspconfig.yaml",
];

const CreateCasesConfigList: CreateConfigType[] = [
  {
    triggerType: CreateProjectTriggerType.Command,
    caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Command} EmptyFolder`,
    templateName,
    templateNameDescription,
    isEmptyFolder: true,
    expectedResults,
  },
];

beforeEach(async () => {
  const dir = CreateTypespecProjectFolderPath;
  try {
    await rm(dir, { recursive: true });
  } catch {}
  await mkdir(dir, { recursive: true });
});

describe.each(CreateCasesConfigList)("CreateTypespecProject", async (item) => {
  const {
    caseName,
    triggerType,
    templateName,
    templateNameDescription,
    isEmptyFolder,
    expectedResults,
  } = item;

  test(caseName, async ({ launch }) => {
    const workspacePath = CreateTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath: triggerType === CreateProjectTriggerType.Command ? workspacePath : "test",
    });
    if (!isEmptyFolder) {
      createTestFile(workspacePath);
    }
    await mockShowOpenDialog(app, [workspacePath]);
    if (triggerType === CreateProjectTriggerType.Command) {
      await startWithCommandPalette(page, "Create Typespec Project");
    } else {
      await startWithClick(page);
    }

    if (!isEmptyFolder) {
      await notEmptyFolderContinue(page);
      deleteTestFile(workspacePath);
    }

    await selectTemplate(page, templateName, templateNameDescription);

    await inputProjectName(page);

    if (templateName === "Generic Rest API") {
      await selectEmitters(page);
    }

    await preContrastResult(page, "Project created", "Failed to create project Successful", 150000);
    await contrastResult(expectedResults, workspacePath);
    app.close();
  });
});
