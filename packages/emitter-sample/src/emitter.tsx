import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, navigateProgram, Operation } from "@typespec/compiler";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";


export async function $onEmit(context: EmitContext) {
  const ops = getAllOperations(context);
  const functions = ops.map(op => (
    <FunctionDeclaration type={op} />
  ));
  
  return (
    <ay.Output>
      <ts.PackageDirectory
        name="test-package"
        version="1.0.0"
        path={context.emitterOutputDir}>
        <ts.SourceFile path="client.ts">
          {functions}
        </ts.SourceFile>
        <ts.BarrelFile />
      </ts.PackageDirectory>
    </ay.Output>
  );
}


function getAllOperations({ program }: EmitContext) {
  const ops: Operation[] = [];
  navigateProgram(program, {
    operation(op) {
      ops.push(op);
    }
  });

  return ops;
}
