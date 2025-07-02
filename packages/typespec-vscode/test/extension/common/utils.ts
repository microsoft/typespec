import { Page, _electron } from "playwright"
import { fileURLToPath } from "node:url";
import fs from "node:fs"
import os from "node:os"
import path, { resolve } from "node:path"
import { test as baseTest, inject } from "vitest"
import { closeVscode } from "./commonSteps"

interface Context {
  page: Page
  extensionDir: string
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
      let envOverrides = {}
      const codePath = path.join(executablePath, "../bin")
      envOverrides = {
        PATH: `${codePath}${path.delimiter}${process.env.PATH}`,
      }
      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "typespec-automation")
      )

      const app = await _electron.launch({
        executablePath,
        env: {
          ...process.env,
          ...envOverrides,
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
      const userSettingsPath = path.join(
        tempDir,
        "user-data",
        "User",
        "settings.json"
      )
      fs.writeFileSync(
        userSettingsPath,
        JSON.stringify({
          "typespec.initTemplatesUrls": [
            {
              name: "Azure",
              url: "https://aka.ms/typespec/azure-init",
            },
          ],
        })
      )
      return { page, extensionDir: path.join(tempDir, "extensions") }
    })

    for (const teardown of teardowns) await teardown()
  },
})

async function sleep(s: number) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

/**
 * @param count Number of retries
 * @param fn Main process retry function, when this function returns true, retry ends
 * @param errMessage If the number of retries reaches 0, an error is thrown
 * @param gap
 * @returns Retry Interval
 */
async function retry(
  page: Page,
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
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  await page.screenshot({ path: path.resolve(__dirname, "../../images-linux/error.png") })
  await closeVscode()
  throw new Error(errMessage)
}

export { sleep, test, retry }
