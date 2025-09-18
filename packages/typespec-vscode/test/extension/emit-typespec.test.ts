import { execSync } from "child_process";
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
import { emiChooseEmitter, emitSelectLanguage, emitSelectType } from "./common/emit-steps";
import { PNPM_NO_MATCHING_VERSION_ERROR, CaseScreenshot, tempDir, test } from "./common/utils";

let shouldSkip = false;

try {
  execSync("pnpm install @typespec/http-client-csharp", { stdio: "pipe" });
  execSync("pnpm install @typespec/http", { stdio: "pipe" });
} catch (e: any) {
  const errorOutput =
    (e.stderr && e.stderr.toString()) ||
    (e.stdout && e.stdout.toString()) ||
    (e.message && e.message.toString()) ||
    "";
  if (PNPM_NO_MATCHING_VERSION_ERROR.test(errorOutput)) {
    const filteredLines = errorOutput
      .split("\n")
      .filter((line: any) => !line.trim().startsWith("../.."));
    filteredLines.unshift(
      "WARN_INFO: skip due to making a release PR. Issue link: https://github.com/microsoft/typespec/issues/8402",
    );
    const filteredErrorOutput = filteredLines.join("\n");
    process.stderr.write(filteredErrorOutput + "\n");
    shouldSkip = true;
  }
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
    caseName: "EmitTypespecProject ClientCode DotNet Trigger CommandPalette TspconfigHasEmit",
    selectType: "Client Code",
    selectTypeLanguage: ".NET",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: true,
    expectedResults: ["http-client-csharp"],
  },
  {
    caseName: "EmitTypespecProject ClientCode DotNet Trigger CommandPalette TspconfigNoEmit",
    selectType: "Client Code",
    selectTypeLanguage: ".NET",
    triggerType: EmitProjectTriggerType.Command,
    TspConfigHasEmit: false,
    expectedResults: ["http-client-csharp"],
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

const describeFn = shouldSkip ? describe.skip : describe;
describeFn.each(EmitCasesConfigList)("EmitTypespecProject", async (item) => {
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
