import { mkdir } from "fs/promises";
import path from "node:path";
import { rimraf } from "rimraf";
import { beforeEach, describe } from "vitest";
import {
  createTestFile,
  deleteTestFile,
  notEmptyFolderContinue,
  startWithCommandPalette,
} from "./common/common-steps";
import {
  inputARMResourceProviderName,
  inputProjectName,
  selectEmitters,
  selectTemplate,
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
let templateName = "Generic Rest API";
let templateNameDescription = "Create a project representing a generic REST API service.";
let expectedResults = [
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

templateName = "(stand alone) Azure Resource Manager Service Project";
templateNameDescription = "Create a stand alone project representing an Azure service ARM API";
expectedResults = [
  "examples",
  "node_modules",
  ".gitignore",
  "employee.tsp",
  "main.tsp",
  "package.json",
  "package-lock.json",
  "tspconfig.yaml",
];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Command,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Command} NonEmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: false,
  expectedResults,
});

const ARMAPIProviderNameTemplates = [
  "(stand alone) Azure Resource Manager Service Project",
];

beforeEach(async () => {
  const dir = CreateTypespecProjectFolderPath;
  try {
    await rimraf(dir);
  } catch {}
  await mkdir(dir, { recursive: true });
});

describe.each(CreateCasesConfigList)("CreateTypespecProject", async (item) => {
  const {
    caseName,
    templateName,
    templateNameDescription,
    isEmptyFolder,
  } = item;

  test(caseName, async ({ launch }) => {
    const workspacePath = CreateTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath: workspacePath,
    });
    if (!isEmptyFolder) {
      createTestFile(workspacePath);
    }
    await mockShowOpenDialog(app, [workspacePath]);
    await startWithCommandPalette(page, "Create Typespec Project");

    if (!isEmptyFolder) {
      await notEmptyFolderContinue(page);
      deleteTestFile(workspacePath);
    }

    await selectTemplate(page, templateName, templateNameDescription);

    await inputProjectName(page);

    if (templateName === "Generic Rest API") {
      await selectEmitters(page);
    } else if (ARMAPIProviderNameTemplates.includes(templateName)) {
      await inputARMResourceProviderName(page);
    }

    app.close();
  });
});
