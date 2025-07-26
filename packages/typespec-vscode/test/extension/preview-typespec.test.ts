import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import { startWithCommandPalette } from "./common/common-steps";
import { tempDir, test } from "./common/utils";

export enum PreviewProjectTriggerType {
  Command = "Command",
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
    const workspacePath = PreviewTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath,
    });
    await page.getByRole("treeitem", { name: "main.tsp" }).locator("a").click();
    await startWithCommandPalette(page, "Preview API Documentation");
    app.close();
  });
});
