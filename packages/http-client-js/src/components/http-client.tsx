import { SourceDirectory } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { SourceFile } from "@alloy-js/typescript";
import { Program } from "@typespec/compiler";
import { Output, TransformNamePolicyContext } from "@typespec/emitter-framework";
import { ClientLibrary } from "@typespec/http-client/components";
import { OperationsDirectory } from "./client-directory.jsx";
import { Client } from "./client.jsx";
import { EncodingProvider } from "./encoding-provider.jsx";
import { httpRuntimeTemplateLib } from "./external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./external-packages/uri-template.js";
import { Models } from "./models.jsx";
import { ModelSerializers } from "./serializers.jsx";
import { Interfaces } from "./static-helpers/interfaces.jsx";
import { MultipartHelpers } from "./static-helpers/multipart-helpers.jsx";
import { PagingHelpers } from "./static-helpers/paging-helper.jsx";
import { RestError } from "./static-helpers/rest-error.jsx";
import { createTransformNamePolicy } from "./transforms/transform-name-policy.js";

export interface HttpClientProps {
  program: Program;
}

export function HttpClient(props: HttpClientProps) {
  const tsNamePolicy = ts.createTSNamePolicy();
  const defaultTransformNamePolicy = createTransformNamePolicy();
  return (
    <Output
      namePolicy={tsNamePolicy}
      externals={[uriTemplateLib, httpRuntimeTemplateLib]}
      program={props.program}
    >
      <ClientLibrary program={props.program}>
        <TransformNamePolicyContext.Provider value={defaultTransformNamePolicy}>
          <EncodingProvider>
            <Client />
            <SourceDirectory path="models">
              <Models />
              <SourceDirectory path="internal">
                <ModelSerializers />
              </SourceDirectory>
            </SourceDirectory>
            <SourceDirectory path="api">
              <OperationsDirectory />
            </SourceDirectory>
            <SourceDirectory path="helpers">
              <PagingHelpers />
              <Interfaces />
              <MultipartHelpers />
              <SourceFile path="error.ts">
                <RestError />
              </SourceFile>
            </SourceDirectory>
          </EncodingProvider>
        </TransformNamePolicyContext.Provider>
      </ClientLibrary>
    </Output>
  );
}
