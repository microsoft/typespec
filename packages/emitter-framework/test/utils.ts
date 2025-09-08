import { type Children, type OutputDirectory, render } from "@alloy-js/core";
import { Output } from "@alloy-js/core/stc";
import { SourceFile } from "@alloy-js/typescript/stc";
import type { Program } from "@typespec/compiler";
import { assert } from "vitest";
import { getProgram } from "./typescript/test-host.js";

export async function getEmitOutput(tspCode: string, cb: (program: Program) => Children) {
  const program = await getProgram(tspCode);

  const res = render(Output().children(SourceFile({ path: "test.ts" }).children(cb(program))), {
    insertFinalNewLine: false,
  });
  const testFile = res.contents.find((file) => file.path === "test.ts")!;
  assert("contents" in testFile, "test.ts file does not have contents");
  return testFile.contents;
}

export function assertFileContents(res: OutputDirectory, contents: string) {
  const testFile = res.contents.find((file) => file.path === "test.ts")!;
  assert(testFile, "test.ts file not rendered");
  assert("contents" in testFile, "test.ts file does not have contents");
  assert.equal(testFile.contents, contents);
}
