import { code, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Operation, Service, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {FunctionDeclaration} from "@typespec/emitter-framework/typescript";
import {getClientContextRefkey} from "./client-context.js"
import { buildSerializer, getSerializerRefkey } from "./model-serializer.jsx";
import { Serializer } from "./serializers-utils.jsx";
import { HttpFetch, HttpFetchRefkey } from "./static-fetch-wrapper.jsx";

export interface OperationsFileProps {
  operations: Operation[];
  service: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  return (
    <ts.SourceFile path="operations.ts">
      {mapJoin(props.operations, (operation) => {
        const params = operation.parameters.properties;
        const  httpOperation = $.httpOperation.get(operation);
        const path = httpOperation.path;
        const method = httpOperation.verb;

        const httpRequestBody = httpOperation.parameters.body;
        let bodySerialize  = null;
        if(httpRequestBody && httpRequestBody.type.kind === "Model") {
          bodySerialize = code`
            body: JSON.stringify(${<Body type={httpRequestBody.type} />}),
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

// Need to revisit this, not super happy with the way this is done
function Body(props: {type: Type}) {
  return <ts.ObjectExpression>
    {mapJoin((props.type as Model).properties, (propertyName, property) => {
      return <ts.ObjectProperty name={property.name} value={Serializer(property.type, buildSerializer, propertyName)} />;
    }, {joiner: ",\n"})}
  </ts.ObjectExpression>
}
