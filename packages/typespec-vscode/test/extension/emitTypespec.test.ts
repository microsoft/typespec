import { beforeAll, beforeEach } from "vitest"
import {
  closeVscode,
  contrastResult,
  installExtension,
  installExtensionForFile,
  preContrastResult,
  start,
} from "./common/commonSteps"
import { emitSelectLanguageForOpenapi, emitSelectType } from "./common/emiSteps"
import { screenShot, test } from "./common/utils"
import path from "node:path"
import fs from "node:fs"

beforeAll(() => {
  screenShot.setCreateType("emit")
})

beforeEach(() => {
  const dir = path.resolve(__dirname, "./EmitTypespecProject/tsp-output")
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.resolve(dir, file)
      fs.rmSync(filePath, { recursive: true, force: true })
    }
  }
})

test("EmitTypespec-OpenAPI Document", async ({ launch }) => {
  screenShot.setDir("EmitTypespec-OpenAPI Document")
  const workspacePath = path.resolve(__dirname, "./EmitTypespecProject")
  const { page } = await launch({
    workspacePath,
  })

  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)
  await start(page, {
    folderName: "EmitTypespecProject",
    command: "Emit from Typespec",
  })
  // await emitSelectProject(page, "TextTranslation")
  await screenShot.screenShot("emitter_list.png")

  await page
    .getByRole("option", { name: "Choose another emitter" })
    .locator("a")
    .click()
  await emitSelectType(page, "OpenAPI Document")

  await emitSelectLanguageForOpenapi(page)

  await preContrastResult(
    page,
    "OpenAPI3...Succeeded",
    "Failed to emit project Successful",
    [10, 3]
  )
  await closeVscode()

  await contrastResult(
    ["openapi.3.0.yaml"],
    path.resolve(workspacePath, "./tsp-output/@typespec/openapi3")
  )
})

test("EmitTypespec-OpenAPI Document 2", async ({ launch }) => {
  screenShot.setDir("EmitTypespec-OpenAPI Document")
  const workspacePath = path.resolve(__dirname, "./EmitTypespecProject")
  const { page } = await launch({
    workspacePath,
  })

  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../extension.vsix")
  // )
  await installExtension(page)
  await start(page, {
    folderName: "EmitTypespecProject",
    command: "Emit from Typespec",
  })
  // await emitSelectProject(page, "TextTranslation")
  await screenShot.screenShot("emitter_list.png")

  await page
    .getByRole("option", { name: "Choose another emitter" })
    .locator("a")
    .click()
  await emitSelectType(page, "OpenAPI Document")

  await emitSelectLanguageForOpenapi(page)

  await preContrastResult(
    page,
    "OpenAPI3...Succeeded",
    "Failed to emit project Successful",
    [10, 3]
  )
  await closeVscode()

  await contrastResult(
    ["openapi.3.0.yaml"],
    path.resolve(workspacePath, "./tsp-output/@typespec/openapi3")
  )
})
