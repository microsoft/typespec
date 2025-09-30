import { Output } from "#core/components/index.js";
import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Program } from "@typespec/compiler";
import { datetimeModule, decimalModule, typingModule } from "./builtins.js";

export function getOutput(program: Program, children: Children[]): Children {
  const policy = py.createPythonNamePolicy();
  return (
    <Output
      program={program}
      externals={[datetimeModule, decimalModule, typingModule, py.enumModule]}
      namePolicy={policy}
    >
      <py.SourceFile path="test.py">{children}</py.SourceFile>
    </Output>
  );
}
