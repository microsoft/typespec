import { Children } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { Program } from "@typespec/compiler";
import { Output as EFOutput, TransformNamePolicyContext } from "@typespec/emitter-framework";
import { ClientLibrary } from "@typespec/http-client/components";
import { EncodingProvider } from "./encoding-provider.jsx";
import { httpRuntimeTemplateLib } from "./external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { createTransformNamePolicy } from "./transforms/transform-name-policy.js";

export interface OutputProps {
  children?: Children;
  program: Program;
}

export function Output(props: OutputProps) {
  const tsNamePolicy = ts.createTSNamePolicy();
  const defaultTransformNamePolicy = createTransformNamePolicy();
  return (
    <EFOutput
      namePolicy={tsNamePolicy}
      externals={[uriTemplateLib, httpRuntimeTemplateLib]}
      program={props.program}
    >
      <ClientLibrary program={props.program}>
        <TransformNamePolicyContext.Provider value={defaultTransformNamePolicy}>
          <EncodingProvider>{props.children}</EncodingProvider>
        </TransformNamePolicyContext.Provider>
      </ClientLibrary>
    </EFOutput>
  );
}
