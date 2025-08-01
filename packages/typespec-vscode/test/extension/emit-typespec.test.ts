import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  contrastResult,
  InstallPackages,
  preContrastResult,
  preparePackageJson,
  readTspConfigFile,
  restoreTspConfigFile,
  startWithCommandPalette,
} from "./common/common-steps";
import { emiChooseEmitter, emitSelectLanguage, emitSelectType } from "./common/emit-steps";
import { CaseScreenshot, projectRoot, tempDir, test } from "./common/utils";

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
    caseName: "EmitTypespecProject ClientCode Python CommandPallette TspconfigHasEmit",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: true,
    expectedResults: ["http-client-python"],
  },
  {
    caseName: "EmitTypespecProject ClientCode Python CommandPallette TspconfigNoEmit",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: false,
    expectedResults: ["http-client-python"],
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
    let removedLines: string[] | undefined = undefined;
    if (!TspConfigHasEmit) {
      const result = readTspConfigFile(workspacePath);
      removedLines = result.removedLines;
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
    if (TspConfigHasEmit) {
      preparePackageJson(projectRoot);
      await InstallPackages(page, "EmitTypeSpec", cs);
    }
    const contrastMessage = "...Succeeded";
    await preContrastResult(page, contrastMessage, "Failed to emit project Successful", 150000);
    await cs.screenshot(page, "emit_result");
    if (!TspConfigHasEmit && removedLines !== undefined) {
      restoreTspConfigFile(workspacePath, removedLines);
    }
    app.close();
    const resultFilePath = path.resolve(workspacePath, "./tsp-output/@typespec");
    await contrastResult(page, expectedResults, resultFilePath, cs);

    try {
      execSync("git restore ./package.json", { stdio: "inherit" });
      execSync("git restore ../../pnpm-lock.yaml", { stdio: "inherit" });
    } catch (e) {
      process.exit(1);
    }
  });
});
