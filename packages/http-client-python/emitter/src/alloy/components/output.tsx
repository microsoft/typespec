import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { Program } from "@typespec/compiler";
import { Output as EFOutput } from "@typespec/emitter-framework";
import {
  datetimeModule,
  decimalModule,
  abcModule as pyAbcBuiltin,
  typingModule,
} from "@typespec/emitter-framework/python";
import { coreHttpModule } from "../external-packages/corehttp.js";

export interface OutputProps {
  children?: Children;
  program: Program;
}

/**
 * Top-level alloy `Output` for the Python renderer.
 *
 * This is intentionally **TCGC-aware** rather than `ClientLibrary`-driven:
 * we feed the TCGC `SdkPackage` (or pieces of it) in as JSX props instead of
 * pulling raw TypeSpec types from `@typespec/http-client`'s `ClientLibrary`,
 * so the renderer can use the same operation classification (basic / lro /
 * paging / lroPaging) that the pygen pipeline already relies on.
 *
 * Externals registered here are: Python standard-library shims provided by
 * EF (`datetime`, `decimal`, `typing`, `abc`); the `@alloy-js/python` builtins
 * (`abcModule`, `dataclassesModule`, `enumModule`); and the `corehttp`
 * runtime descriptor used for `LROPoller` and friends.
 */
export function Output(props: OutputProps) {
  const pythonNamePolicy = py.createPythonNamePolicy();
  return (
    <EFOutput
      namePolicy={pythonNamePolicy}
      externals={[
        pyAbcBuiltin,
        datetimeModule,
        decimalModule,
        typingModule,
        py.abcModule,
        py.dataclassesModule,
        py.enumModule,
        coreHttpModule,
      ]}
      program={props.program}
    >
      {props.children}
    </EFOutput>
  );
}
