import { beforeAll, beforeEach, describe } from "vitest"
import {
  contrastResult,
  startWithCommandPalette,
  selectFolder,
  preContrastResult,
  closeVscode,
  installExtensionForCommand,
  createTestFile,
  deleteTestFile,
  notEmptyFolderContinue,
} from "./common/commonSteps"
import { test } from "./common/utils"
import fs from "node:fs"
import path from "node:path"
import {
  inputServiceNameSpace,
  inputARMResourceProviderName,
  inputProjectName,
  selectEmitters,
  selectTemplate,
  startWithClick,
} from "./common/createSteps"
import {
  CreateCasesConfigList,
  CreateProjectTriggerType,
} from "./config"

beforeEach(() => {
  const dir = path.resolve(__dirname, "./CreateTypespecProject")
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.resolve(dir, file)
      fs.rmSync(filePath, { recursive: true, force: true })
    }
  } else {
    fs.mkdirSync(dir, { recursive: true })
  }
})

describe.each(CreateCasesConfigList)("CreateTypespecProject", async (item) => {
  const {
    caseName,
    triggerType,
    templateName,
    templateNameDesctiption,
    isEmptyFolder,
    expectedResults,
  } = item

  test(caseName, async ({ launch }) => {
    const workspacePath = path.resolve(__dirname, "./CreateTypespecProject")
    const { page, extensionDir } = await launch({
      workspacePath:
        triggerType === CreateProjectTriggerType.Command
          ? workspacePath
          : "test",
    })

    if (!isEmptyFolder) {
      createTestFile(workspacePath)
    }

    await installExtensionForCommand(page, extensionDir)

    if (triggerType === CreateProjectTriggerType.Command) {
      await startWithCommandPalette(page, {
        folderName: "CreateTypespecProject",
        command: "Create Typespec Project",
      })
    } else {
      await startWithClick(page)
    }

    await selectFolder(page, 
      triggerType === CreateProjectTriggerType.Command ? "" : workspacePath
    )

    if (!isEmptyFolder) {
      await notEmptyFolderContinue(page)
      deleteTestFile(workspacePath)
    }

    await selectTemplate(page, templateName, templateNameDesctiption)

    await inputProjectName(page)

    if (templateName === "Generic Rest API") {
      await selectEmitters(page)
    }

    await preContrastResult(
      page,
      "Project created",
      "Failed to create project Successful",
      [10, 15]
    )
    await closeVscode()
    await contrastResult(page, expectedResults, workspacePath)
  })
})
