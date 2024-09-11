import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation, Service } from "@typespec/compiler";
import {FunctionDeclaration} from "@typespec/emitter-framework/typescript";
import {getClientContextRefkey} from "./client-context.js"
import { HttpRequest } from "./http-request.js";
import { HttpResponse } from "./http-response.jsx";

export interface OperationsFileProps {
  operations: Operation[];
  service?: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  if(!props.service) {
    return null;
  }

  return (
    <ts.SourceFile path="operations.ts">
      {mapJoin(props.operations, (operation) => {
        const responseRefkey = refkey();
        return (
          <FunctionDeclaration export async type={operation} parameters={{"client": <ts.Reference refkey={getClientContextRefkey(props.service!)}/>}}>
            <HttpRequest operation={operation} responseRefkey={responseRefkey} />
            <HttpResponse operation={operation} responseRefkey={responseRefkey} />
          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>
  );
}
