import { execSync } from "child_process";
import { rm } from "fs/promises";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import { startWithCommandPalette, tryInstallAndHandle } from "./common/common-steps";
import { CaseScreenshot, retry, tempDir, test, testfilesDir } from "./common/utils";

// Test files are copied into the temporary directory before tests run
beforeAll(async () => {
  const src = path.resolve(testfilesDir, "PreviewTypespecProject");
  const dest = path.resolve(tempDir, "PreviewTypespecProject");
  fs.cpSync(src, dest, { recursive: true });
}, 300000);

let shouldSkip = false;

shouldSkip = tryInstallAndHandle("@typespec/http") || shouldSkip;
shouldSkip = tryInstallAndHandle("@typespec/openapi3") || shouldSkip;

export enum PreviewProjectTriggerType {
  Command = "CommandPalette",
  Click = "Click",
}

type PreviewConfigType = {
  caseName: string;
  triggerType: PreviewProjectTriggerType;
};

const PreviewTypespecProjectFolderPath = path.resolve(tempDir, "PreviewTypespecProject");

const PreviewCaseName = `PreviewTypespecProject`;
const PreviewCasesConfigList: PreviewConfigType[] = [];

PreviewCasesConfigList.push({
  caseName: `${PreviewCaseName} Trigger ${PreviewProjectTriggerType.Command}`,
  triggerType: PreviewProjectTriggerType.Command,
});

beforeEach(() => {
  const previewTypespec = PreviewTypespecProjectFolderPath;
  if (fs.existsSync(previewTypespec)) {
    let hasMainTsp = false;
    for (const file of fs.readdirSync(previewTypespec)) {
      if (file === "main.tsp") {
        hasMainTsp = true;
      } else {
        const filePath = path.resolve(previewTypespec, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
    if (!hasMainTsp) {
      throw new Error("Failed to find main.tsp file");
    }
  } else {
    throw new Error("Failed to find PreviewTypespecProject directory");
  }
});

afterAll(() => {
  try {
    execSync("pnpm uninstall @typespec/http", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
  try {
    execSync("pnpm uninstall @typespec/openapi3", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
  try {
    execSync("git restore ./../../pnpm-lock.yaml", { stdio: "pipe" });
  } catch (e) {
    process.exit(1);
  }
});

const describeFn = shouldSkip ? describe.skip : describe;
describeFn.each(PreviewCasesConfigList)("PreviewAPIDocument", async (item) => {
  const { caseName } = item;
  test(caseName, async ({ launch }) => {
    const cs = new CaseScreenshot(caseName);
    const workspacePath = PreviewTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath,
    });
    await page.getByRole("treeitem", { name: "main.tsp" }).locator("a").click();
    await startWithCommandPalette(page, "Preview API Documentation", cs);
    await retry(
      page,
      10,
      async () => {
        const previewContent = page
          .locator("iframe")
          .contentFrame()
          .locator("iframe")
          .contentFrame()
          .getByRole("heading", { name: "Widget Service 0.0.0 OAS" });
        return (await previewContent.count()) > 0;
      },
      "Failed to compilation completed successfully",
      3,
      cs,
    );
    await rm(cs.caseDir, { recursive: true });
    app.close();
  });
});
