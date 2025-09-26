import { type Children, type OutputDirectory, render } from "@alloy-js/core";
import { Output as StcOutput, SourceFile as StcSourceFile } from "@alloy-js/core/stc";
import { createPythonNamePolicy, SourceFile } from "@alloy-js/python";
import type { Program } from "@typespec/compiler";
import { type ModelProperty } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { assert } from "vitest";
import { Output } from "../../src/core/components/output.jsx";
import { datetimeModule, decimalModule, typingModule } from "./builtins.js";
import { getProgram } from "./test-host.js";

// Reimplementing so we can set the correct extensions
export async function getEmitOutput(tspCode: string, cb: (program: Program) => Children) {
  const program = await getProgram(tspCode);

  const res = render(
    StcOutput().children(StcSourceFile({ path: "test.py", filetype: "py" }).children(cb(program))),
  );
  const testFile = res.contents.find((file) => file.path === "test.py")!;
  assert("contents" in testFile, "test.py file does not have contents");
  return testFile.contents;
}

// Reimplementing so we can set the correct extensions
export function assertFileContents(res: OutputDirectory, contents: string) {
  const testFile = res.contents.find((file) => file.path === "test.py")!;
  assert(testFile, "test.py file not rendered");
  assert("contents" in testFile, "test.py file does not have contents");
  assert.equal(testFile.contents, contents);
}

function getExternals() {
  return [datetimeModule, decimalModule, typingModule];
}

export function getOutput(program: Program, children: Children[]): Children {
  const policy = createPythonNamePolicy();
  return (
    <Output program={program} externals={getExternals()} namePolicy={policy}>
      <SourceFile path="test.py">{children}</SourceFile>
    </Output>
  );
}

async function compileCode(code: string, runner: BasicTestRunner) {
  const { test } = await runner.compile(code);
  return test;
}

async function compileCodeModelProperty(code: string, runner: BasicTestRunner) {
  const test = await compileCode(code, runner);
  return test as ModelProperty;
}

export async function compileCodeModelPropertyType(code: string, runner: BasicTestRunner) {
  const property = await compileCodeModelProperty(code, runner);
  return property.type;
}

export async function compileModelProperty(ref: string, runner: BasicTestRunner) {
  const test = await compileCode(
    `
    model Test {
      @test test: ${ref};
    }
  `,
    runner,
  );

  return test as ModelProperty;
}

export async function compileModelPropertyType(ref: string, runner: BasicTestRunner) {
  return (await compileModelProperty(ref, runner)).type;
}
