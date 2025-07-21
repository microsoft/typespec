import { mkdir } from "fs/promises";
import path from "node:path";
import { rimraf } from "rimraf";
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
  inputARMResourceProviderName,
  inputProjectName,
  inputServiceNameSpace,
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

templateName = "Typespec library";
templateNameDescription =
  "Build your own TypeSpec library with custom types, decorators or linters.";
expectedResults = [
  "lib",
  "node_modules",
  "src",
  "test",
  ".gitignore",
  "eslint.config.js",
  "package.json",
  "package-lock.json",
  "prettierrc.yaml",
  "tsconfig.json",
];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Click,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Click} EmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: true,
  expectedResults,
});

templateName = "Typespec emitter";
templateNameDescription = "Create a new package that emits artifacts from TypeSpec.";
expectedResults = [
  "node_modules",
  "src",
  "test",
  ".gitignore",
  "eslint.config.js",
  "package.json",
  "package-lock.json",
  "prettierrc.yaml",
  "tsconfig.json",
];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Command,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Command} NonEmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: false,
  expectedResults,
});

templateName = "(rest-api-spec repo) Azure Data Plane Service Project";
templateNameDescription =
  "Create a project in rest-api-spec repo, representing an Azure service Data Plane API";
expectedResults = ["examples", ".gitignore", "client.tsp", "main.tsp", "tspconfig.yaml"];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Click,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Click} EmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: true,
  expectedResults,
});

templateName = "(rest-api-spec repo) Azure Resource Manager Service Project";
templateNameDescription =
  "Create a project in rest-api-spec repo, representing an Azure service ARM API";
expectedResults = ["examples", ".gitignore", "employee.tsp", "main.tsp", "tspconfig.yaml"];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Click,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Click} NonEmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: false,
  expectedResults,
});

templateName = "(stand alone) Azure Data Plane Service Project";
templateNameDescription =
  "Create a stand alone project representing an Azure service Data Plane API";
expectedResults = [
  "examples",
  "node_modules",
  ".gitignore",
  "client.tsp",
  "main.tsp",
  "package.json",
  "package-lock.json",
  "tspconfig.yaml",
];

CreateCasesConfigList.push({
  triggerType: CreateProjectTriggerType.Command,
  caseName: `${createCase} ${templateName.replaceAll(" ", "")} Trigger ${CreateProjectTriggerType.Command} EmptyFolder`,
  templateName,
  templateNameDescription,
  isEmptyFolder: true,
  expectedResults,
});

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

const DataPlaneAPIProviderNameTemplates = [
  "(rest-api-spec repo) Azure Data Plane Service Project",
  "(stand alone) Azure Data Plane Service Project",
];

const ARMAPIProviderNameTemplates = [
  "(rest-api-spec repo) Azure Resource Manager Service Project",
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
    triggerType,
    templateName,
    templateNameDescription,
    isEmptyFolder,
    expectedResults,
  } = item;

  test(caseName, async ({ launch }) => {
    const workspacePath = CreateTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath:
        triggerType === CreateProjectTriggerType.Command ? workspacePath : "path_not_exist",
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
    } else if (DataPlaneAPIProviderNameTemplates.includes(templateName)) {
      await inputServiceNameSpace(page);
    } else if (ARMAPIProviderNameTemplates.includes(templateName)) {
      await inputARMResourceProviderName(page);
    }

    await preContrastResult(page, "Project created", "Failed to create project Successful", 150000);
    app.close();
    await contrastResult(page, expectedResults, workspacePath);
  });
});
