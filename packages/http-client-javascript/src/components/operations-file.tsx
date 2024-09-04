import { code, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Operation, Service, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {FunctionDeclaration, ModelTransformExpression} from "@typespec/emitter-framework/typescript";
import {getClientContextRefkey} from "./client-context.js"
import { HttpFetchRefkey } from "./static-fetch-wrapper.jsx";

export interface OperationsFileProps {
  operations: Operation[];
  service: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  return (
    <ts.SourceFile path="operations.ts">
      {mapJoin(props.operations, (operation) => {
        const  httpOperation = $.httpOperation.get(operation);
        const path = httpOperation.path;
        const method = httpOperation.verb;

        const httpRequestBody = httpOperation.parameters.body;
        let bodySerialize  = null;
        if(httpRequestBody && httpRequestBody.type.kind === "Model") {
          bodySerialize = code`
            body: JSON.stringify(${<ModelTransformExpression type={httpRequestBody.type} target="transport" itemPath="response.body"/>}),
          `
        }

        return (
          <FunctionDeclaration export async type={operation} parameters={{"client": <ts.Reference refkey={getClientContextRefkey(props.service)}/>}}>
            {code`
              const url = \`\${client.endpoint}${path}\`;
              const options = {
                method: "${method}",
                headers: {
                  "Content-Type": "application/json",
                },
                ${bodySerialize}
               };

               return ${<ts.Reference refkey={HttpFetchRefkey}/>}(url, options);
            `}

          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>
  );
}
