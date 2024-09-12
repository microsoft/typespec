import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext, Enum, listServices, Model, Namespace, navigateProgram, navigateType, Operation, Scalar, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import path from "path";
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
  const types = {
    dataTypes: Array.from(visited.dataTypes.values()).flat(),
    operations: Array.from(visited.operations.values()).flat(),
  }
  const tsNamePolicy = ts.createTSNamePolicy();
  const outputDir = context.emitterOutputDir;
  const service = listServices(context.program)[0];
  return (
    <ay.Output namePolicy={tsNamePolicy} externals={[uriTemplateLib]}>
      <ts.PackageDirectory name="test-package" version="1.0.0" path={outputDir}>
        <ay.SourceDirectory path="src">
          <ay.SourceDirectory path="models">
            <ts.BarrelFile />
            <ModelsFile types={types.dataTypes} />
            <ModelSerializers types={types.dataTypes} />
          </ay.SourceDirectory>
          <ay.SourceDirectory path="api">
            <ClientContext service={service} />
            <OperationsFile operations={types.operations} service={service} />
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
  const types = new Map<Namespace | undefined, Set<DataType>>();
  const operations = new Map<Namespace | undefined, Set<Operation>>();
  navigateProgram(context.program, {
    operation(o) {
      if(!operations.has(o.namespace)) {
        operations.set(o.namespace, new Set());
      }
      const ops = operations.get(o.namespace)!;
      ops.add(o);
      
      navigateType(o, {
        model(m) {
          trackType(types, m);
        }, modelProperty(p) {
          trackType(types, p.type);
        },
         scalar(s) {
          if($.scalar.getStdBase(s) === s) {
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

  const dataTypes: Map<Namespace | undefined, DataType[]> = new Map();
  const ops: Map<Namespace | undefined, Operation[]> = new Map();

  for(const [ns, ts] of types) {
    dataTypes.set(ns, Array.from(ts));
  }
  
  for(const [ns, os] of operations) {
    ops.set(ns, Array.from(os));
  }

  return {dataTypes, operations: ops};
 
}

type DataType =  Model | Union | Enum | Scalar;

function isDataType(type: Type): type is DataType {
  return type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar";
}

function isDeclaredType(type: Type): boolean {
  if(!isDataType(type)) {
    return false;
  }

  if(type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Map<Namespace | undefined, Set<DataType>>, type: Type) {

  if(!isDataType(type)) {
    return;
  }

  if(!isDeclaredType(type)) {
    return;
  }

  if(!types.has(type.namespace)) {
    types.set(type.namespace, new Set());
  }

  const ts = types.get(type.namespace)!;
  ts.add(type);
}
