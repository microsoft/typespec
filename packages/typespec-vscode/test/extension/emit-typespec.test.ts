import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  contrastResult,
  preContrastResult,
  readTspConfigFile,
  restoreTspConfigFile,
  startWithCommandPalette,
} from "./common/common-steps";
import {
  emiChooseEmitter,
  emitInstallPackages,
  emitSelectLanguage,
  emitSelectType,
} from "./common/emit-steps";
import { screenshot, tempDir, test } from "./common/utils";
import { execSync } from "child_process";

try {
  execSync("pnpm install @typespec/http", { stdio: "inherit" });
  execSync("pnpm install @typespec/openapi3", { stdio: "inherit" });
  execSync("pnpm install @typespec/http-client-python", { stdio: "inherit" });
  execSync("pnpm list", { stdio: "inherit" });
  execSync("sudo apt update", { stdio: "inherit" });
  execSync("sudo apt install python3", { stdio: "inherit" });
  execSync("python3 --version", { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}

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
  // {
  //   caseName: "EmitTypespecProject ClientCode Python CommandPallette TspconfigNoEmit",
  //   selectType: "Client Code",
  //   selectTypeLanguage: "Python",
  //   triggerType: EmitProjectTriggerType.Command,
  //   TspConfigHasEmit: false,
  //   expectedResults: ["http-client-python"],
  // },
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
    const workspacePath = EmitTypespecProjectFolderPath;
    let removedLines: string[] | undefined = undefined;
    if (!TspConfigHasEmit) {
      const result = readTspConfigFile(workspacePath);
      removedLines = result.removedLines;
    }
    const { page, app } = await launch({
      workspacePath,
    });
    await startWithCommandPalette(page, "Emit from Typespec");
    if (TspConfigHasEmit) {
      await emiChooseEmitter(page);
    }

    await emitSelectType(page, selectType);
    await emitSelectLanguage(page, selectTypeLanguage, selectType);
    await emitInstallPackages(page, selectTypeLanguage, selectType);
    const contrastMessage = selectTypeLanguage + "...Succeeded";
    await preContrastResult(page, contrastMessage, "Failed to emit project Successful", 150000);
    await screenshot(page, "linux", "emit_result");
    if (!TspConfigHasEmit && removedLines !== undefined) {
      restoreTspConfigFile(workspacePath, removedLines);
    }
    app.close();
    const resultFilePath = path.resolve(workspacePath, "./tsp-output/@typespec");
    await contrastResult(page, expectedResults, resultFilePath);
  });
});
