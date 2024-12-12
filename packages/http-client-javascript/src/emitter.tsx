import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import { ClientContext } from "./components/client-context/client-context.jsx";
import { ClientDirectory } from "./components/client-directory.jsx";
import { ClientOperations } from "./components/client-operation.jsx";
import { Client } from "./components/client.jsx";
import { httpRuntimeTemplateLib } from "./components/external-packages/ts-http-runtime.js";
import { uriTemplateLib } from "./components/external-packages/uri-template.js";
import { Models } from "./components/models.js";
import { ModelSerializers } from "./components/serializers.js";

export async function $onEmit() {
  const tsNamePolicy = ts.createTSNamePolicy();
  const rootNs = $.clientLibrary.listNamespaces()[0]; // TODO: Handle multiple namespaces
  const topLevelClient = $.client.getClient(rootNs); // TODO: Handle multiple clients
  const flatClients = $.client.flat(topLevelClient);
  const dataTypes = $.client.listDataTypes(topLevelClient);

  return <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib, httpRuntimeTemplateLib]}>
        <ts.PackageDirectory name="test-package" version="1.0.0" path=".">
          <ay.SourceDirectory path="src">
            <ts.BarrelFile export="." />
            <Client client={topLevelClient} />
            <ay.SourceDirectory path="models">
              <ts.BarrelFile export="models"/>
              <Models types={dataTypes} />
              <ModelSerializers types={dataTypes} />
            </ay.SourceDirectory>
            <ay.SourceDirectory path="api">
              <ts.BarrelFile export="api" />
              {ay.mapJoin(flatClients, (client) => (
                <ClientDirectory client={client}>
                  <ClientOperations client={client} />
                  <ClientContext client={client} />
                </ClientDirectory>
              ))}
            </ay.SourceDirectory>
          </ay.SourceDirectory>
        </ts.PackageDirectory>
    </ay.Output>;
}
