import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Model, Operation } from "@typespec/compiler";
import { TypeCollector } from "@typespec/emitter-framework";
import { FunctionDeclaration, InterfaceDeclaration } from "@typespec/emitter-framework/typescript";

export async function $onEmit(context: EmitContext) {
  const types = queryTypes(context);

  const functions = ay.mapJoin(types.ops, (op) => {
    return (
      <FunctionDeclaration export type={op}>
        return "stub";
      </FunctionDeclaration>
    );
  });

  const interfaces = ay.mapJoin(types.dataTypes, (m) => <InterfaceDeclaration type={m} />);

  const calls = ay.mapJoin(types.ops, (op) => {
    return (
      <ts.VarDeclaration export name={op.name + "Result"}>
        <ts.Reference refkey={ay.refkey(op)} />
        ("hello")
      </ts.VarDeclaration>
    );
  });

  return (
    <ay.Output>
      <ts.PackageDirectory name="test-package" version="1.0.0" path={context.emitterOutputDir}>
        <ts.SourceFile path="client.ts">
          {interfaces}
          {functions}
        </ts.SourceFile>
        <ts.SourceFile path="test.ts">{calls}</ts.SourceFile>
        <ts.BarrelFile />
      </ts.PackageDirectory>
    </ay.Output>
  );
}

function queryTypes(context: EmitContext) {
  const types = new Set<Model>();
  const ops = new Set<Operation>();
  const globalns = context.program.getGlobalNamespaceType();
  const allTypes = new TypeCollector(globalns).flat();
  for (const op of allTypes.operations) {
    ops.add(op);

    const referencedTypes = new TypeCollector(op).flat();
    for (const model of referencedTypes.models) {
      types.add(model);
    }
  }

  return { dataTypes: [...types], ops: [...ops] };
}
