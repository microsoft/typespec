import { beforeAll, beforeEach } from "vitest"
import { screenShot, test } from "./common/utils"
import fs from "node:fs"
import path from "node:path"
import {
  closeVscode,
  contrastResult,
  installExtension,
  installExtensionForFile,
  notEmptyFolderContinue,
  preContrastResult,
  selectFolder,
  start,
} from "./common/commonSteps"

beforeAll(() => {
  screenShot.setCreateType("import")
})

beforeEach(() => {
  const importTypespec = path.resolve(
    __dirname,
    "./ImportTypespecProjectOpenApi3"
  )
  if (fs.existsSync(importTypespec)) {
    let hasOpenapi3File = false
    for (const file of fs.readdirSync(importTypespec)) {
      if (file === "openapi.3.0.yaml") {
        hasOpenapi3File = true
      } else {
        const filePath = path.resolve(importTypespec, file)
        fs.rmSync(filePath, { recursive: true, force: true })
      }
    }
    if (!hasOpenapi3File) {
      throw new Error("Failed to find openapi3 file")
    }
  } else {
    throw new Error("Failed to find ImportTypespecProjectOpenApi3 directory")
  }
})

test("ImportTypespecFromOpenApi3", async ({ launch }) => {
  screenShot.setDir("ImportTypespecFromOpenApi3")
  const workspacePath = path.resolve(
    __dirname,
    "./importTypespecProjectOpenApi3"
  )
  const { page } = await launch({
    workspacePath,
  })
  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)

  await start(page, {
    folderName: "importTypespecProjectOpenApi3",
    command: "Import TypeSpec from Openapi3",
  })
  await selectFolder()
  await notEmptyFolderContinue(page)
  await selectFolder("openapi.3.0.yaml")
  await preContrastResult(
    page,
    "OpenAPI succeeded",
    "Failed to import project successfully",
    [10, 3]
  )
  await closeVscode()
  await contrastResult(["openapi.3.0.yaml", "main.tsp"], workspacePath)
})

test("ImportTypespecFromOpenApi3 2", async ({ launch }) => {
  screenShot.setDir("ImportTypespecFromOpenApi3")
  const workspacePath = path.resolve(
    __dirname,
    "./importTypespecProjectOpenApi3"
  )
  const { page } = await launch({
    workspacePath,
  })
  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)

  await start(page, {
    folderName: "importTypespecProjectOpenApi3",
    command: "Import TypeSpec from Openapi 3",
  })
  await selectFolder()
  await notEmptyFolderContinue(page)
  await selectFolder("openapi.3.0.yaml")
  await preContrastResult(
    page,
    "OpenAPI succeeded",
    "Failed to import project successfully",
    [10, 3]
  )
  await closeVscode()
  await contrastResult(["openapi.3.0.yaml", "main.tsp"], workspacePath)
})
