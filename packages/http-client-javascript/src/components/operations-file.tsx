import { code, mapJoin } from "@alloy-js/core";
import * as ay from "@alloy-js/typescript";
import { Operation, Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as ts from "@typespec/emitter-framework/typescript";
import {getClientContextFactoryRefkey, getClientContextRefkey} from "./client-context.js"
export interface OperationsFileProps {
  operations: Operation[];
  service: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  return (
    <ay.SourceFile path="operations.ts">
      {mapJoin(props.operations, (operation) => {
        const params = operation.parameters.properties;
        const  httpOperation = $.httpOperation.get(operation);
        const path = httpOperation.path;
        const method = httpOperation.verb;

        return (
          <ts.FunctionDeclaration type={operation} parameters={{"client": <ay.Reference refkey={getClientContextRefkey(props.service)} />}}>
          </ts.FunctionDeclaration>
        );
      })}
    </ay.SourceFile>
  );
}
