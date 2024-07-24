import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { TypeCollector } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  const globalns = context.program.getGlobalNamespaceType();
  const types = new TypeCollector(globalns).flat();
  
  const functions = ay.mapJoin(types.operations, op => (
    <FunctionDeclaration export type={op}>
      return "stub";
    </FunctionDeclaration>
  ));

  const calls = ay.mapJoin(types.operations, (op) => {
    return <ts.VarDeclaration export name={op.name + "Result"}>
      <ts.Reference refkey={ay.refkey(op)} />("hello")
    </ts.VarDeclaration>
  });

  return (
    <ay.Output>
      <ts.PackageDirectory
        name="test-package"
        version="1.0.0"
        path={context.emitterOutputDir}>
        <ts.SourceFile path="client.ts">
          {functions}
        </ts.SourceFile>
        <ts.SourceFile path="test.ts">
          {calls}
        </ts.SourceFile>
        <ts.BarrelFile />
      </ts.PackageDirectory>
    </ay.Output>
  );
}
