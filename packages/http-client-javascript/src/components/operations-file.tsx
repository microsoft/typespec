import { code, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation, Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {FunctionDeclaration, ModelTransformExpression} from "@typespec/emitter-framework/typescript";
import {getClientContextRefkey} from "./client-context.js"
import { HttpRequest } from "./http-request.js";

export interface OperationsFileProps {
  operations: Operation[];
  service: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  return (
    <ts.SourceFile path="operations.ts">
      {mapJoin(props.operations, (operation) => {
        return (
          <FunctionDeclaration export async type={operation} parameters={{"client": <ts.Reference refkey={getClientContextRefkey(props.service)}/>}}>
            <HttpRequest operation={operation} />
          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>
  );
}
