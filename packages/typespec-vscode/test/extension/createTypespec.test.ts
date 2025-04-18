import { beforeAll, beforeEach } from "vitest"
import {
  contrastResult,
  start,
  selectFolder,
  preContrastResult,
  installExtensionForFile,
  closeVscode,
  installExtension,
} from "./common/commonSteps"
import { screenShot, test } from "./common/utils"
import fs from "node:fs"
import path from "node:path"
import {
  inputProjectName,
  selectEmitters,
  selectTemplate,
} from "./common/createSteps"

beforeAll(() => {
  screenShot.setCreateType("create")
})

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

test("CreateTypespec-Generic REST API", async ({ launch }) => {
  screenShot.setDir("CreateTypespec-Generic REST API1")
  const workspacePath = path.resolve(__dirname, "./CreateTypespecProject")
  const { page } = await launch({
    workspacePath,
  })
  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)

  await start(page, {
    folderName: "CreateTypespecProject",
    command: "Create Typespec Project",
  })
  await selectFolder()
  await selectTemplate(page, "Generic REST API")
  await inputProjectName(page)
  await selectEmitters(page, ["OpenAPI"])
  await preContrastResult(
    page,
    "Project created!",
    "Failed to create project Successful",
    [10, 10]
  )
  await closeVscode()
  await contrastResult(
    [
      ".gitignore",
      "main.tsp",
      "node_modules",
      "package-lock.json",
      "package.json",
      "tspconfig.yaml",
    ],
    workspacePath
  )
})

test("CreateTypespec-Generic REST API 2", async ({ launch }) => {
  screenShot.setDir("CreateTypespec-Generic REST API1")
  const workspacePath = path.resolve(__dirname, "./CreateTypespecProject")
  const { page } = await launch({
    workspacePath,
  })
  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)

  await start(page, {
    folderName: "CreateTypespecProject",
    command: "Create Typespec Project",
  })
  await selectFolder()
  await selectTemplate(page, "Generic REST API")
  await inputProjectName(page)
  await selectEmitters(page, ["OpenAPI"])
  await preContrastResult(
    page,
    "Project created!",
    "Failed to create project Successful",
    [10, 10]
  )
  await closeVscode()
  await contrastResult(
    [
      ".gitignore",
      "main.tsp",
      "node_modules",
      "package-lock.json",
      "package.json",
      "tspconfig.yaml",
    ],
    workspacePath
  )
})

// test("CreateTypespec-Special scenarios-button", async ({ launch }) => {
//   const { page } = await launch({ workspacePath: "./test" })
//   await installExtension(page)

//   await page
//     .getByLabel(/Explorer/)
//     .first()
//     .click()
//   await page.getByRole("button", { name: "Create TypeSpec Project" }).click()
//   await selectFolder()
//   await notEmptyFolderContinue(page)
//   await closeVscode(page)
// })
