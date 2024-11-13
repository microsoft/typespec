import { Children, render } from "@alloy-js/core";
import { Output } from "@alloy-js/core/stc";
import { SourceFile } from "@alloy-js/typescript/stc";
import { Program } from "@typespec/compiler";
import { getProgram } from "./typescript/test-host.js";

export async function getEmitOutput(tspCode: string, cb: (program: Program) => Children) {
  const program = await getProgram(tspCode);

  const res = render(Output().children(SourceFile({ path: "test.ts" }).children(cb(program))));
  const testFile = res.contents.find((file) => file.path === "test.ts")!;

  return testFile.contents;
}
