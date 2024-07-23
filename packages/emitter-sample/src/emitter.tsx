import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import {} from "./index.js";

export async function $onEmit(context: EmitContext) {
  return (
    <ay.Output>
      <ts.PackageDirectory
        name="test-package"
        version="1.0.0"
        path={context.emitterOutputDir}>
        <ts.SourceFile path="client.ts">
          <ts.FunctionDeclaration name="makeRestCall">
            return fetch("http://localhost:8080");
          </ts.FunctionDeclaration>
        </ts.SourceFile>
        <ts.BarrelFile />
      </ts.PackageDirectory>
    </ay.Output>
  );
}
