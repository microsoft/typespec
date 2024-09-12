import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation, Service, Type } from "@typespec/compiler";
import {FunctionDeclaration, TypeExpression} from "@typespec/emitter-framework/typescript";
import {getClientContextRefkey} from "./client-context.js"
import { HttpRequest } from "./http-request.js";
import { HttpResponse } from "./http-response.jsx";
import { $ } from "@typespec/compiler/typekit";

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
        const responses = $.httpOperation.getResponses(operation).filter(r => r.statusCode !== "*")

        let httpResponse: Type | undefined;
        if(responses.length > 1) {
          const res = [...new Set(responses.map(r => r.responseContent.body?.type))].filter(t => t !== undefined)
          httpResponse = $.union.create({
            variants: res.map(t => $.unionVariant.create({type: t})),
          })
        } else {
          httpResponse = responses[0].responseContent.body?.type
        }
        const responseRefkey = refkey();
        return (
          <FunctionDeclaration export async type={operation} returnType={httpResponse ?<TypeExpression type={httpResponse} /> : "void"} parameters={{"client": <ts.Reference refkey={getClientContextRefkey(props.service!)}/>}}>
            <HttpRequest operation={operation} responseRefkey={responseRefkey} />
            <HttpResponse operation={operation} responseRefkey={responseRefkey} />
          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>
  );
}
