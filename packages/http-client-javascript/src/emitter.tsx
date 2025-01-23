import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { ClientLibrary } from "@typespec/http-client-library/components";
import { OperationsDirectory } from "./components/client-directory.jsx";
import { Client } from "./components/client.jsx";
import { httpRuntimeTemplateLib } from "./components/external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./components/external-packages/uri-template.js";
import { Models } from "./components/models.js";
import { ModelSerializers } from "./components/serializers.js";
import { MultipartHelpers } from "./components/static-helpers/multipart-helpers.jsx";
import { httpParamsMutator } from "./utils/operations.js";

export async function $onEmit(context: EmitContext) {
  const tsNamePolicy = ts.createTSNamePolicy();
  return <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib, httpRuntimeTemplateLib]}>
        <ClientLibrary operationMutators={[httpParamsMutator]}>
        <ts.PackageDirectory name="test-package" version="1.0.0" path="." scripts={{ "build": "tsc" }}>
          <ay.SourceDirectory path="src">
            <ts.BarrelFile export="." />
            <Client/>
            <ay.SourceDirectory path="models">
              <ts.BarrelFile export="models"/>
              <Models />
              <ModelSerializers />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="api">
                <OperationsDirectory />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="helpers">
              <MultipartHelpers />
            </ay.SourceDirectory>
          </ay.SourceDirectory>
        </ts.PackageDirectory>
        </ClientLibrary>

    </ay.Output>;
}
