import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { OperationsDirectory } from "./components/client-directory.jsx";
import { Client } from "./components/client.jsx";
import { httpRuntimeTemplateLib } from "./components/external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./components/external-packages/uri-template.js";
import { Models } from "./components/models.js";
import { ModelSerializers } from "./components/serializers.js";
import { MultipartHelpers } from "./components/static-helpers/multipart-helpers.jsx";

export async function $onEmit(context: EmitContext) {
  const tsNamePolicy = ts.createTSNamePolicy();
  const rootNs = $.clientLibrary.listNamespaces()[0]; // TODO: Handle multiple namespaces
  const topLevelClient = $.client.getClient(rootNs); // TODO: Handle multiple clients
  const dataTypes = $.clientLibrary.listDataTypes(topLevelClient);

  return <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib, httpRuntimeTemplateLib]}>
        <ts.PackageDirectory name="test-package" version="1.0.0" path="." scripts={{ "build": "tsc" }}>
          <ay.SourceDirectory path="src">
            <ts.BarrelFile export="." />
            <Client client={topLevelClient} />
            <ay.SourceDirectory path="models">
              <ts.BarrelFile export="models"/>
              <Models types={dataTypes} />
              <ModelSerializers types={dataTypes} />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="api">
                <OperationsDirectory client={topLevelClient} />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="helpers">
              <MultipartHelpers />
            </ay.SourceDirectory>
          </ay.SourceDirectory>
        </ts.PackageDirectory>
    </ay.Output>;
}
