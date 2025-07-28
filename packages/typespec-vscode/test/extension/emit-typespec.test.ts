import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import {
  preContrastResult,
  readTspConfigFile,
  restoreTspConfigFile,
  startWithCommandPalette,
} from "./common/common-steps";
import { emiChooseEmitter, emitSelectLanguage, emitSelectType } from "./common/emit-steps";
import { screenshot, tempDir, test } from "./common/utils";

enum EmitProjectTriggerType {
  Command = "Command",
  Click = "Click",
}

type EmitConfigType = {
  caseName: string;
  selectType: string;
  selectTypeLanguage: string;
  triggerType: EmitProjectTriggerType;
  hasTspConfig?: boolean;
  expectedResults: string[];
};

const EmitTypespecProjectFolderPath = path.resolve(tempDir, "EmitTypespecProject");

const EmitCasesConfigList: EmitConfigType[] = [
  {
    caseName: "EmitTypespecProject ClientCode Python CommandPallette HasTspconfig",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    hasTspConfig: true,
    expectedResults: ["http-client-python"],
  },
  {
    caseName: "EmitTypespecProject ClientCode Python CommandPallette NoTspconfig",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    hasTspConfig: false,
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
  const { caseName, selectType, selectTypeLanguage, hasTspConfig } = item;
  test(caseName, async ({ launch }) => {
    const workspacePath = EmitTypespecProjectFolderPath;
    let removedLines: string[] | undefined = undefined;
    const { page, app } = await launch({
      workspacePath,
    });
    if (!hasTspConfig) {
      const result = readTspConfigFile(workspacePath);
      removedLines = result.removedLines;
    }
    await startWithCommandPalette(page, "Emit from Typespec");
    if (hasTspConfig) {
      await emiChooseEmitter(page);
    }

    await emitSelectType(page, selectType);
    await emitSelectLanguage(page, selectTypeLanguage, selectType);

    const contrastMessage = selectTypeLanguage;
    await preContrastResult(page, contrastMessage, "Failed to emit project Successful", 150000);
    await screenshot(page, "linux", "emit_result");
    if (!hasTspConfig && removedLines !== undefined) {
      restoreTspConfigFile(workspacePath, removedLines);
    }
    app.close();
  });
});
