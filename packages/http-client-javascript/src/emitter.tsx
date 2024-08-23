import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, getNamespaceFullName, isStdNamespace, Type } from "@typespec/compiler";
import { TypeCollector } from "@typespec/emitter-framework";
import { namespace as HttpNamespace } from "@typespec/http";
import { ModelsFile } from "./components/models-file.js";
import { ModelSerializers } from "./components/serializers.js";

const RestNamespace = "TypeSpec.Rest";

export async function $onEmit(context: EmitContext) {
  const types = queryTypes(context);
  const tsNamePolicy = ts.createTSNamePolicy();

  return (
    <ay.Output namePolicy={tsNamePolicy}>
      <ts.PackageDirectory name="test-package" version="1.0.0" path={context.emitterOutputDir}>
        <ModelsFile types={types.dataTypes} />
        <ModelSerializers types={types.dataTypes} />
        <ts.BarrelFile />
      </ts.PackageDirectory>
    </ay.Output>
  );
}

function queryTypes(context: EmitContext) {
  const types = new Set<Type>();
  const globalns = context.program.getGlobalNamespaceType();
  const allTypes = new TypeCollector(globalns).flat();
  for (const dataType of [...allTypes.models, ...allTypes.unions, ...allTypes.enums, ...allTypes.scalars]) {
    if (isNoEmit(dataType)) {
      continue;
    }

    types.add(dataType);
  }

  return { dataTypes: [...types] };
}

function isNoEmit(type: Type): boolean {
  // Skip anonymous types
  if (!(type as any).name) {
    return true;
  }

  if ("namespace" in type && type.namespace) {
    if (isStdNamespace(type.namespace)) {
      return true;
    }

    const fullNamespaceName = getNamespaceFullName(type.namespace);

    if ([HttpNamespace].includes(fullNamespaceName)) {
      return true;
    }
    if ([RestNamespace].includes(fullNamespaceName)) {
      return true;
    }
  }

  return false;
}
