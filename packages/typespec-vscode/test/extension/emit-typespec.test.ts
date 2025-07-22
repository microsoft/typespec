import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe } from "vitest";
import { preContrastResult, startWithCommandPalette } from "./common/common-steps";
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
  expectedResults: string[];
};

const EmitTypespecProjectFolderPath = path.resolve(tempDir, "EmitTypespecProject");

const EmitCasesConfigList: EmitConfigType[] = [
  {
    caseName: "EmitTypespecProject-ClientCode-Python-CommandPallette",
    selectType: "Client Code",
    selectTypeLanguage: "Python",
    triggerType: EmitProjectTriggerType.Command,
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
  const { caseName, selectType, selectTypeLanguage } = item;
  test(caseName, async ({ launch }) => {
    const workspacePath = EmitTypespecProjectFolderPath;
    const { page, app } = await launch({
      workspacePath,
    });

    await startWithCommandPalette(page, "Emit from Typespec");
    await emiChooseEmitter(page);
    await emitSelectType(page, selectType);
    await emitSelectLanguage(page, selectTypeLanguage, selectType);

    const contrastMessage = selectTypeLanguage;
    await preContrastResult(page, contrastMessage, "Failed to emit project Successful", 150000);
    await screenshot(page, "linux", "emit_result");

    app.close();
  });
});
