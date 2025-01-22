import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { OperationsDirectory } from "./components/client-directory.jsx";
import { Client } from "./components/client.jsx";
import { httpRuntimeTemplateLib } from "./components/external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./components/external-packages/uri-template.js";
import { Models } from "./components/models.js";
import { ModelSerializers } from "./components/serializers.js";
import { MultipartHelpers } from "./components/static-helpers/multipart-helpers.jsx";
import { discoverClients } from "./utils/client-discovery.js";

export async function $onEmit(context: EmitContext) {
  const tsNamePolicy = ts.createTSNamePolicy();
  const { client, dataTypes } = discoverClients();

  return <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib, httpRuntimeTemplateLib]}>
        <ts.PackageDirectory name="test-package" version="1.0.0" path="." scripts={{ "build": "tsc" }}>
          <ay.SourceDirectory path="src">
            <ts.BarrelFile export="." />
            <Client client={client} />
            <ay.SourceDirectory path="models">
              <ts.BarrelFile export="models"/>
              <Models types={dataTypes} />
              <ModelSerializers types={dataTypes} />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="api">
                <OperationsDirectory client={client} />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="helpers">
              <MultipartHelpers />
            </ay.SourceDirectory>
          </ay.SourceDirectory>
        </ts.PackageDirectory>
    </ay.Output>;
}
