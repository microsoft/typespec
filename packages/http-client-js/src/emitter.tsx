import { Children, SourceDirectory } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { useTsp, writeOutput } from "@typespec/emitter-framework";
import {
  ComponentOverrides,
  ComponentOverridesConfig,
  TypeExpression,
} from "@typespec/emitter-framework/typescript";
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
      <HttpClientOverrides>
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
      </HttpClientOverrides>
    </Output>
  );

  await writeOutput(context.program, output, context.emitterOutputDir);
}

export function HttpClientOverrides(props: { children?: Children }) {
  const { $ } = useTsp();
  const overrides = ComponentOverridesConfig().forTypeKind("Model", {
    reference: (props) => {
      if ($.httpPart.is(props.type)) {
        return <TypeExpression type={$.httpPart.unpack(props.type)} />;
      } else {
        return props.default;
      }
    },
  });
  return <ComponentOverrides overrides={overrides}>{props.children}</ComponentOverrides>;
}
