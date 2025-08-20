import { execSync } from "child_process";
import { rm } from "fs/promises";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import { startWithCommandPalette } from "./common/common-steps";
import { CaseScreenshot, retry, tempDir, test } from "./common/utils";

try {
  execSync("pnpm install @typespec/http", { stdio: "inherit" });
  execSync("pnpm install @typespec/openapi3", { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}

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

describe.each(PreviewCasesConfigList)("PreviewAPIDocument", async (item) => {
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
    try {
      execSync("git restore ./package.json", { stdio: "inherit" });
    } catch (e) {
      process.exit(1);
    }
    try {
      execSync("git restore ../../pnpm-lock.yaml", { stdio: "inherit" });
    } catch (e) {
      process.exit(1);
    }
  });
});
