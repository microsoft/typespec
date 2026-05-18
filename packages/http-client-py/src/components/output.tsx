import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { Program } from "@typespec/compiler";
import { Output as EFOutput, TransformNamePolicyContext } from "@typespec/emitter-framework";
import {
  datetimeModule,
  decimalModule,
  abcModule as pyAbcBuiltin,
  typingModule,
} from "@typespec/emitter-framework/python";
import { ClientLibrary } from "@typespec/http-client/components";
import { coreHttpModule } from "./external-packages/corehttp.js";
import { createTransformNamePolicy } from "./transforms/transform-name-policy.js";

export interface OutputProps {
  children?: Children;
  program: Program;
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
      ]}
      program={props.program}
    >
      <ClientLibrary program={props.program}>
        <TransformNamePolicyContext.Provider value={defaultTransformNamePolicy}>
          {props.children}
        </TransformNamePolicyContext.Provider>
      </ClientLibrary>
    </EFOutput>
  );
}
