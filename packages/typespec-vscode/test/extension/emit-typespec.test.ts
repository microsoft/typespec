import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe } from "vitest";
import {
  contrastResult,
  packagesInstall,
  packPackages,
  preContrastResult,
  readTspConfigFile,
  restoreTspConfigFile,
  startWithCommandPalette,
} from "./common/common-steps";
import { emiChooseEmitter, emitSelectLanguage, emitSelectType } from "./common/emit-steps";
import { CaseScreenshot, tempDir, test, testfilesDir } from "./common/utils";

// Test files are copied into the temporary directory before tests run
beforeAll(async () => {
  const src = path.resolve(testfilesDir, "EmitTypespecProject");
  const dest = path.resolve(tempDir, "EmitTypespecProject");
  fs.cpSync(src, dest, { recursive: true });

  const packages = await packPackages();
  // Install those packages locally
  await packagesInstall(packages);
}, 300000);

enum EmitProjectTriggerType {
  Command = "Command",
  Click = "Click",
}

type EmitConfigType = {
  caseName: string;
  selectType: string;
  selectTypeLanguage: string;
  triggerType: EmitProjectTriggerType;
  TspConfigHasEmit?: boolean;
  expectedResults: string[];
};

const EmitTypespecProjectFolderPath = path.resolve(tempDir, "EmitTypespecProject");

const EmitCasesConfigList: EmitConfigType[] = [
  {
    caseName: "EmitTypespecProject ClientCode Js Trigger CommandPalette TspconfigHasEmit",
    selectType: "Client Code",
    selectTypeLanguage: "JavaScript",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: true,
    expectedResults: ["http-client-js"],
  },
  {
    caseName: "EmitTypespecProject ClientCode Js Trigger CommandPalette TspconfigNoEmit",
    selectType: "Client Code",
    selectTypeLanguage: "JavaScript",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: false,
    expectedResults: ["http-client-js"],
  },
];

beforeEach(() => {
  const dir = path.resolve(EmitTypespecProjectFolderPath, "tsp-output");
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.resolve(dir, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
});

describe.each(EmitCasesConfigList)("EmitTypespecProject", async (item) => {
  const { caseName, selectType, selectTypeLanguage, TspConfigHasEmit, expectedResults } = item;
  test(caseName, async ({ launch }) => {
    const cs = new CaseScreenshot(caseName);
    const workspacePath = EmitTypespecProjectFolderPath;
    let content: string | undefined = undefined;
    if (!TspConfigHasEmit) {
      const result = readTspConfigFile(workspacePath);
      content = result.content;
    }
    const { page, app } = await launch({
      workspacePath,
    });
    await startWithCommandPalette(page, "Emit from Typespec", cs);
    if (TspConfigHasEmit) {
      await emiChooseEmitter(page, cs);
    }

    await emitSelectType(page, selectType, cs);
    await emitSelectLanguage(page, selectTypeLanguage, selectType, cs);
    const contrastMessage = "...Succeeded";
    await preContrastResult(
      page,
      contrastMessage,
      "Failed to emit project Successful",
      150000,
      cs,
      app,
    );
    await cs.screenshot(page, "emit_result");
    if (!TspConfigHasEmit && content !== undefined) {
      restoreTspConfigFile(workspacePath, content);
    }
    const resultFilePath = path.resolve(workspacePath, "./tsp-output/@typespec");
    await contrastResult(expectedResults, resultFilePath, cs);
    app.close();
  });
});
