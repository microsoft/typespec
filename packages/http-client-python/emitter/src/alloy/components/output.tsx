import type { Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Program } from "@typespec/compiler";
import { Output as EFOutput, TransformNamePolicyContext } from "@typespec/emitter-framework";
import {
  datetimeModule,
  decimalModule,
  abcModule as pyAbcBuiltin,
  typingModule,
} from "@typespec/emitter-framework/python";
import { azureCoreModule, coreHttpModule } from "../external-packages/corehttp.js";
import { createTransformNamePolicy } from "../transforms/transform-name-policy.js";

export interface OutputProps {
  program: Program;
  children?: Children;
}

export function Output(props: OutputProps) {
  const pythonNamePolicy = py.createPythonNamePolicy();
  const defaultTransformNamePolicy = createTransformNamePolicy();
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
        azureCoreModule,
      ]}
      program={props.program}
    >
      <TransformNamePolicyContext.Provider value={defaultTransformNamePolicy}>
        {props.children}
      </TransformNamePolicyContext.Provider>
    </EFOutput>
  );
}
