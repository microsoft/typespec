import { beforeEach } from "vitest"
import {
  closeVscode,
  contrastResult,
  installExtension,
  installExtensionForFile,
  preContrastResult,
  start,
} from "./common/commonSteps"
import {
  emitSelectLanguageForOpenapi,
  emitSelectProject,
  emitSelectType,
} from "./common/emiSteps"
import { screenshotSelf, test } from "./common/utils"
import path from "node:path"
import fs from "node:fs"

beforeEach(() => {
  const dir = path.resolve(
    __dirname,
    "./EmitTypespecProject/Azure.AI.TextTranslation/tsp-output"
  )
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.resolve(dir, file)
      fs.rmSync(filePath, { recursive: true, force: true })
    }
  }
})

test("EmitTypespec-OpenAPI Document", async ({ launch }) => {
  const workspacePath = path.resolve(__dirname, "./EmitTypespecProject")
  const { page } = await launch({
    workspacePath,
  })

  // await installExtensionForFile(
  //   page,
  //   path.resolve(__dirname, "../../extension.vsix")
  // )
  await installExtension(page)
  await start(page, {
    folderName: "EmitTypespecProject",
    command: "Emit from Typespec",
  })
  // await emitSelectProject(page, "TextTranslation")

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
  await closeVscode(page)
  await contrastResult(
    ["openapi.3.0.yaml"],
    path.resolve(workspacePath, "tsp-output/schema")
  )
})
