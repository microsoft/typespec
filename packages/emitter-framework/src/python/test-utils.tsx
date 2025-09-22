import { Output } from "#core/components/index.js";
import { type Children } from "@alloy-js/core";
import { createPythonNamePolicy, SourceFile } from "@alloy-js/python";
import type { Program } from "@typespec/compiler";
import { datetimeModule, decimalModule, typingModule } from "./builtins.js";

export function getOutput(program: Program, children: Children[]): Children {
  const policy = createPythonNamePolicy();
  return (
    <Output
      program={program}
      externals={[datetimeModule, decimalModule, typingModule]}
      namePolicy={policy}
    >
      <SourceFile path="test.py">{children}</SourceFile>
    </Output>
  );
}
