import { Page, _electron } from "@playwright/test"
import fs from "node:fs"
import os from "node:os"
import path, { resolve } from "node:path"
import { test as baseTest, inject } from "vitest"
import screenshot from "screenshot-desktop"

interface Context {
  page: Page
}

type LaunchFixture = (options: {
  extensionPath?: string
  workspacePath: string
  trace?: "on" | "off"
}) => Promise<Context>

/**
 * The core method of the test, this method is encapsulated.
 * With the help of the `_electron` object, you can open a vscode and get the page object
 */
const test = baseTest.extend<{
  launch: LaunchFixture
  taskName: string
  logPath: string
}>({
  taskName: async ({ task }, use) => use(`${task.name}-${task.id}`),
  logPath: async ({ taskName }, use) =>
    use(resolve(`./tests-logs-${taskName}.txt`)),
  launch: async ({ taskName, logPath }, use) => {
    const teardowns: (() => Promise<void>)[] = []

    await use(async (options) => {
      const executablePath = inject("executablePath")
      const workspacePath = options.workspacePath

      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "typespec-automation")
      )

      const app = await _electron.launch({
        executablePath,
        env: {
          ...process.env,
          VITEST_VSCODE_E2E_LOG_FILE: logPath,
          VITEST_VSCODE_LOG: "verbose",
        },
        args: [
          "--no-sandbox",
          "--disable-gpu-sandbox",
          "--disable-updates",
          "--skip-welcome",
          "--skip-release-notes",
          "--disable-workspace-trust",
          `--extensions-dir=${path.resolve(tempDir, "extensions")}`,
          `--user-data-dir=${path.resolve(tempDir, "user-data")}`,
          `--folder-uri=file:${path.resolve(workspacePath)}`,
        ].filter((v): v is string => !!v),
      })
      const page = await app.firstWindow()

      return { page }
    })

    for (const teardown of teardowns) await teardown()
  },
})

async function sleep(s: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, (process.env.CI ? s + 5 : s) * 1000)
  )
}

/**
 * @param count Number of retries
 * @param fn Main process retry function, when this function returns true, retry ends
 * @param errMessage If the number of retries reaches 0, an error is thrown
 * @param gap
 * @returns Retry Interval
 */
async function retry(
  count: number,
  fn: () => Promise<boolean>,
  errMessage: string,
  gap: number = 2
) {
  while (count > 0) {
    await sleep(gap)
    if (await fn()) {
      return
    }
    count--
  }
  throw new Error(errMessage)
}

/**
 * Screenshot function
 * @param fileName The file name when the screenshot is saved
 * @param createType The type of screenshot, create, emit or import, corresponding to three folders respectively
 * @param isLocal If true, it will trigger a save when running locally, otherwise it will only be saved in CI
 */
async function screenshotSelf(
  fileName: string,
  createType: "create" | "emit" | "import",
  isLocal = false
) {
  if (process.env.CI || isLocal) {
    fileName = "/images/" + createType + "/" + fileName
    await sleep(3)
    let img = await screenshot()
    let buffer = Buffer.from(img)
    const outputDir =
      process.env.BUILD_ARTIFACT_STAGING_DIRECTORY ||
      path.resolve(__dirname, "../..")
    const filePath = path.join(outputDir, fileName)

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    console.log(filePath);
    fs.writeFileSync(filePath, buffer)
  }
}

export { sleep, test, retry, screenshotSelf }
