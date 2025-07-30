import type { Children } from "@alloy-js/core/jsx-runtime";
import { SourceFile } from "@alloy-js/typescript";
import type { Program } from "@typespec/compiler";
import { Output } from "../../src/core/components/output.jsx";

export function TestFile(props: { program: Program; children: Children }) {
  return (
    <Output program={props.program}>
      <SourceFile path="test.ts">{props.children}</SourceFile>
    </Output>
  );
}
