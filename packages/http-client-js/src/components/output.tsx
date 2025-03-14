import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { TransformNamePolicyContext } from "@typespec/emitter-framework";
import { ClientLibrary } from "@typespec/http-client/components";
import { httpParamsMutator } from "../utils/operations.js";
import { EncodingProvider } from "./encoding-provider.jsx";
import { httpRuntimeTemplateLib } from "./external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { createTransformNamePolicy } from "./transforms/transform-name-policy.js";

export interface OutputProps {
  children?: ay.Children;
}

export function Output(props: OutputProps) {
  const tsNamePolicy = ts.createTSNamePolicy();
  const defaultTransformNamePolicy = createTransformNamePolicy();
  return (
    <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib, httpRuntimeTemplateLib]}>
      <ClientLibrary operationMutators={[httpParamsMutator]}>
        <TransformNamePolicyContext.Provider value={defaultTransformNamePolicy}>
          <EncodingProvider>{props.children}</EncodingProvider>
        </TransformNamePolicyContext.Provider>
      </ClientLibrary>
    </ay.Output>
  );
}
