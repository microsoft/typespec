import fs from "node:fs";
import path, { join } from "node:path";
import { ElectronApplication, Page, _electron } from "playwright";
import { test as baseTest, inject } from "vitest";

export const PNPM_NO_MATCHING_VERSION_ERROR =
  /ERR_PNPM_NO_MATCHING_VERSION.*No matching version found/;

const __dirname = import.meta.dirname;
export const projectRoot = path.resolve(__dirname, "../../../");
export const tempDir = path.resolve(projectRoot, "./temp");
export const testfilesDir = path.resolve(projectRoot, "./test/scenarios");
export const imagesPath = path.resolve(tempDir, "./images-linux");

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
      await fs.promises.mkdir(artifactsDir, { recursive: true }); // make sure the directory exists
      process.env.TMPDIR = artifactsDir;
      await page.context().tracing.start({ screenshots: false, snapshots: true, title: task.name });
      teardowns.push(async () => {
        try {
          await page.context().tracing.stop({ path: tracePath });
        } catch (error) {}
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
  cs: CaseScreenshot,
) {
  while (count > 0) {
    await sleep(gap);
    if (await fn()) {
      return;
    }
    count--;
  }
  await cs.screenshot(page, "error");
  throw new Error(errMessage);
}

/**
 * Take a screenshot with a consistent path pattern.
 * @param page playwright page
 * @param os operating system, e.g. "linux"
 * @param name screenshot name, without extension
 */

export class CaseScreenshot {
  private caseName: string;
  private baseDir: string;
  public caseDir: string;
  private screenshotCount: number = 1;

  /**
   * @param caseName
   * @param baseDir screenshot root directory, default images-linux
   */
  constructor(caseName: string, baseDir?: string) {
    this.caseName = caseName.replace(/[\\/:*?"<>|]/g, "_");
    this.baseDir = baseDir ?? imagesPath;
    this.caseDir = path.join(this.baseDir, this.caseName);
  }

  /**
   * Take a screenshot and save it in a folder named after the case.
   * @param page playwright page
   * @param name Screenshot name (without extension)
   */
  async screenshot(page: Page, name: string) {
    await fs.promises.mkdir(this.caseDir, { recursive: true });
    const filePath = path.join(this.caseDir, `${this.screenshotCount}_${name}.png`);
    await page.screenshot({ path: filePath });
    this.screenshotCount++;
  }
}
