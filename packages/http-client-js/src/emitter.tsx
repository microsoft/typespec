import { SourceDirectory } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";
import { OperationsDirectory } from "./components/client-directory.jsx";
import { Client } from "./components/client.jsx";
import { Models } from "./components/models.js";
import { Output } from "./components/output.jsx";
import { ModelSerializers } from "./components/serializers.js";
import { Interfaces } from "./components/static-helpers/interfaces.jsx";
import { MultipartHelpers } from "./components/static-helpers/multipart-helpers.jsx";
import { PagingHelpers } from "./components/static-helpers/paging-helper.jsx";
import { RestError } from "./components/static-helpers/rest-error.jsx";
import { JsClientEmitterOptions } from "./lib.js";

/**
 * Main function to handle the emission process.
 * @param context - The context for the emission process.
 */
export async function $onEmit(context: EmitContext<JsClientEmitterOptions>) {
  const packageName = context.options["package-name"] ?? "test-package";
  const output = (
    <Output program={context.program}>
      <ts.PackageDirectory
        name={packageName}
        version="1.0.0"
        path="."
        scripts={{ build: "tsc" }}
        devDependencies={{ "@types/node": "~18.19.75" }}
      >
        <SourceDirectory path="src">
          <ts.BarrelFile export="." />
          <Client />
          <SourceDirectory path="models">
            <ts.BarrelFile export="models" />
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
            <ts.SourceFile path="error.ts">
              <RestError />
            </ts.SourceFile>
          </SourceDirectory>
        </SourceDirectory>
      </ts.PackageDirectory>
    </Output>
  );

  await writeOutput(context.program, output, context.emitterOutputDir);
}
