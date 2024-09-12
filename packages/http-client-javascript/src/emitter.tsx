import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Enum, listServices, Model, navigateProgram, navigateType, Operation, Scalar, Type, Union } from "@typespec/compiler";
import { ClientContext } from "./components/client-context.js";
import { uriTemplateLib } from "./components/external-packages/uri-template.js";
import { ModelsFile } from "./components/models-file.js";
import { OperationsFile } from "./components/operations-file.js";
import { ModelSerializers } from "./components/serializers.js";
import {
  HttpFetchDeclaration,
  HttpFetchOptionsDeclaration,
} from "./components/static-fetch-wrapper.jsx";

export async function $onEmit(context: EmitContext) {
  const visited = operationWalker(context);
  const tsNamePolicy = ts.createTSNamePolicy();
  const outputDir = context.emitterOutputDir;
  const service = listServices(context.program)[0];
  return (
    <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib]} basePath={outputDir}>
      <ts.PackageDirectory name="test-package" version="1.0.0" path=".">
        <ay.SourceDirectory path="src">
          <ay.SourceDirectory path="models">
            <ts.BarrelFile />
            <ModelsFile types={visited.dataTypes} />
            <ModelSerializers types={visited.dataTypes} />
          </ay.SourceDirectory>
          <ay.SourceDirectory path="api">
            <ClientContext service={service} />
            <OperationsFile operations={visited.operations} service={service} />
            <ts.BarrelFile />
          </ay.SourceDirectory>
          <ay.SourceDirectory path="utilities">
            <ts.SourceFile path="http-fetch.ts">
              <HttpFetchOptionsDeclaration />
              <HttpFetchDeclaration />
            </ts.SourceFile>
          </ay.SourceDirectory>
        </ay.SourceDirectory>
      </ts.PackageDirectory>
    </ay.Output>
  );
}

function operationWalker(context: EmitContext) {
  const types = new Set<DataType>();
  const operations = new Set<Operation>();
  navigateProgram(context.program, {
    operation(o) {
      operations.add(o);
      navigateType(o, {
        model(m) {
          trackType(types, m);
        }, modelProperty(p) {
          trackType(types, p.type);
        },
         scalar(s) {
          if(s.namespace?.name !== "TypeSpec") {
            return;
          }

          trackType(types, s);
         },
         enum(e) {
          trackType(types, e);
         },
         union(u) {
          trackType(types, u);
         },
         unionVariant(v) {
          trackType(types, v.type);
         }
      }, {includeTemplateDeclaration: false});
    }
  }, {includeTemplateDeclaration: false});

  const dataTypes = Array.from(types);
  const operationsArray = Array.from(operations);

  return {dataTypes, operations: operationsArray};
 
}

type DataType =  Model | Union | Enum | Scalar;

function isDataType(type: Type): type is DataType {
  return type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar";
}

function isDeclaredType(type: Type): boolean {
  if("namespace" in type && type.namespace?.name === "TypeSpec") {
    return false;
  }
  
  if(!isDataType(type)) {
    return false;
  }

  if(type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Set<DataType>, type: Type) {

  if(!isDataType(type)) {
    return;
  }

  if(!isDeclaredType(type)) {
    return;
  }

  types.add(type);
}
