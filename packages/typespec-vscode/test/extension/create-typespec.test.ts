import { mkdir } from "fs/promises";
import path from "node:path";
import { rimraf } from "rimraf";
import { beforeEach, describe } from "vitest";
import { contrastResult, startWithCommandPalette, preContrastResult } from "./common/common-steps";
import { inputProjectName, selectEmitters, selectTemplate } from "./common/create-steps";
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
    await rimraf(dir);
  } catch {}
  await mkdir(dir, { recursive: true });
});

describe.each(CreateCasesConfigList)("CreateTypespecProject", async (item) => {
  const { caseName, templateName, templateNameDescription } = item;

  test(caseName, async ({ launch }) => {
    const workspacePath = CreateTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath: workspacePath,
    });

    await mockShowOpenDialog(app, [workspacePath]);
    await startWithCommandPalette(page, "Create Typespec Project");

    await selectTemplate(page, templateName, templateNameDescription);

    await inputProjectName(page);

    await selectEmitters(page);
    await preContrastResult(page, "Project created", "Failed to create project Successful", 150000);
    app.close();
    await contrastResult(page, expectedResults, workspacePath);
  });
});
