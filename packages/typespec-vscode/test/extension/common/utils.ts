import fs from "node:fs";
import os from "node:os";
import path, { join } from "node:path";
import { ElectronApplication, Page, _electron } from "playwright";
import { test as baseTest, inject } from "vitest";

const __dirname = import.meta.dirname;
export const projectRoot = path.resolve(__dirname, "../../../");
export const tempDir = path.resolve(projectRoot, "test/extension/temp");
export const imagesPath = path.resolve(projectRoot, "test/extension/temp/images-linux");

interface Context {
  page: Page;
  app: ElectronApplication;
}

type LaunchFixture = (options: {
  extensionPath?: string;
  workspacePath: string;
  trace?: "on" | "off";
}) => Promise<Context>;

/**
 * The core method of the test, this method is encapsulated.
 * With the help of the `_electron` object, you can open a vscode and get the page object
 */
export const test = baseTest.extend<{
  launch: LaunchFixture;
}>({
  launch: async ({ task }, use) => {
    const teardowns: (() => Promise<void>)[] = [];

    await use(async (options) => {
      const executablePath = inject("executablePath");
      const workspacePath = options.workspacePath;
      let envOverrides = {};
      const codePath = path.join(executablePath, "../bin");
      envOverrides = {
        PATH: `${codePath}${path.delimiter}${process.env.PATH}`,
      };
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "typespec-automation"));

      const app = await _electron.launch({
        executablePath,
        env: {
          ...process.env,
          ...envOverrides,
        },
        args: [
          "--no-sandbox",
          "--disable-gpu-sandbox",
          "--disable-updates",
          "--skip-welcome",
          "--skip-release-notes",
          "--disable-workspace-trust",
          `--extensions-dir=${path.resolve(tempDir, "extensions")}`,
          `--extensionDevelopmentPath=${path.resolve(projectRoot)}`,
          `--user-data-dir=${path.resolve(tempDir, "user-data")}`,
          `--folder-uri=file:${path.resolve(workspacePath)}`,
        ].filter((v): v is string => !!v),
      });
      const page = await app.firstWindow();
      const tracePath = join(projectRoot, "test-results", task.name, "trace.zip");
      const artifactsDir = join(tempDir, "playwright-artifacts");
      console.log("Trace path:", tracePath);
      process.env.TMPDIR = artifactsDir;
      await page.context().tracing.start({ screenshots: true, snapshots: true, title: task.name });
      console.log("Tracing started...");
      teardowns.push(async () => {
        console.log("Stopping tracing...");
        try {
          await page.context().tracing.stop({ path: tracePath });
        } catch (error) {
          console.error("Failed to stop tracing:", error);
        }
        console.log("Tracing stopped.");
      });
      return { page, app };
    });

    for (const teardown of teardowns) await teardown();
  },
});

export async function sleep(s: number) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

/**
 * @param count Number of retries
 * @param fn Main process retry function, when this function returns true, retry ends
 * @param errMessage If the number of retries reaches 0, an error is thrown
 * @param gap
 * @returns Retry Interval
 */
export async function retry(
  page: Page,
  count: number,
  fn: () => Promise<boolean>,
  errMessage: string,
  gap: number = 2,
) {
  while (count > 0) {
    await sleep(gap);
    if (await fn()) {
      return;
    }
    count--;
  }
  await screenshot(page, "linux", "error");
  throw new Error(errMessage);
}

/**
 * Take a screenshot with a consistent path pattern.
 * @param page playwright page
 * @param os operating system, e.g. "linux"
 * @param name screenshot name, without extension
 */
export async function screenshot(page: Page, os: "linux", name: string) {
  const filePath = path.join(imagesPath, `${name}.png`);
  await page.screenshot({ path: filePath });
}
