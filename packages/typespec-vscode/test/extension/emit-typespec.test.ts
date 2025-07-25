import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import { preContrastResult, startWithCommandPalette, deleteTspConfigFile, createTspConfigFile } from "./common/common-steps";
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
    caseName: "EmitTypespecProject ClientCode Python CommandPallette",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    hasTspConfig: false,
    expectedResults: ["http-client-python"],
  },
  {
    caseName: "EmitTypespecProject ClientCode Python CommandPallette",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
    hasTspConfig: true,
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
    const { page, app } = await launch({
      workspacePath,
    });
    if (!hasTspConfig) {
      deleteTspConfigFile(workspacePath);
    } else if (hasTspConfig) {
      createTspConfigFile(workspacePath);
    }
    await startWithCommandPalette(page, "Emit from Typespec");
    if (hasTspConfig){
      await emiChooseEmitter(page);
    }
    await emitSelectType(page, selectType);
    await emitSelectLanguage(page, selectTypeLanguage, selectType);

    const contrastMessage = selectTypeLanguage;
    await preContrastResult(page, contrastMessage, "Failed to emit project Successful", 150000);
    await screenshot(page, "linux", "emit_result");

    app.close();
  });
});
