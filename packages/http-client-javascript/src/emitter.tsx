import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, getNamespaceFullName, isStdNamespace, Type, listServices } from "@typespec/compiler";
import { TypeCollector } from "@typespec/emitter-framework";
import { namespace as HttpNamespace } from "@typespec/http";
import { ModelsFile } from "./components/models-file.js";
import { ModelSerializers } from "./components/serializers.js";
import path from "path";

const RestNamespace = "TypeSpec.Rest";

export async function $onEmit(context: EmitContext) {
  const types = queryTypes(context);
  const tsNamePolicy = ts.createTSNamePolicy();
  const outputDir = context.emitterOutputDir;
  const sourcesDir = path.join(outputDir, "src");
  const modelsDir = path.join(sourcesDir, "models");
  const apiDir = path.join(sourcesDir, "api");
  const service = listServices(context.program)[0]!;

  return (
    <ay.Output namePolicy={tsNamePolicy}>
      <ts.PackageDirectory name="test-package" version="1.0.0" path={outputDir}>
        <ay.SourceDirectory path={sourcesDir}>
          <ay.SourceDirectory path={modelsDir}>
            <ModelsFile types={types.dataTypes} />
            <ModelSerializers types={types.dataTypes} />
          </ay.SourceDirectory>
          <ay.SourceDirectory path={apiDir}>
            
          </ay.SourceDirectory>
        </ay.SourceDirectory>
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
