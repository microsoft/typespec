import { For, List, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTsp } from "@typespec/emitter-framework";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../lib.js";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { HttpRequest } from "./http-request.jsx";
import { HttpResponse } from "./http-response.jsx";
import { OperationPipeline } from "./operation-handlers/operation-pipeline.jsx";
import { PaginatedOperationHandler } from "./operation-handlers/paging/paginated-operation-handler.jsx";
import { OperationOptionsDeclaration } from "./operation-options.jsx";
import { getOperationParameters } from "./operation-parameters.jsx";

export interface ClientOperationsProps {
  client: cl.Client;
}

export function ClientOperations(props: ClientOperationsProps) {
  const namePolicy = ts.useTSNamePolicy();
  const clientOperations = props.client.operations;
  const fileName = namePolicy.getName(props.client.name + "Operations", "variable");

  if (clientOperations.length === 0) {
    return null;
  }

  return (
    <ts.SourceFile path={`${fileName}.ts`}>
      <For each={clientOperations}>
        {(operation) => (
          <OperationPipeline
            httpOperation={operation.httpOperation}
            pipeline={{ handlers: [PaginatedOperationHandler] }}
          />
        )}
      </For>
    </ts.SourceFile>
  );
}

export interface ClientOperationProps {
  httpOperation: HttpOperation;
  refkey: Refkey;
  internal?: boolean;
}

function getClientOperationOptionsParamRef(httpOperation: HttpOperation): Refkey {
  return refkey(httpOperation, "client-operation-options-parameter");
}

export function ClientOperation(props: ClientOperationProps) {
  const { $ } = useTsp();
  const optionsRefkey = getClientOperationOptionsParamRef(props.httpOperation);
  const clientLibrary = cl.useClientLibrary();
  const client = clientLibrary.getClientForOperation(props.httpOperation);

  if (!client) {
    reportDiagnostic($.program, {
      code: "client-not-found",
      target: props.httpOperation.operation,
    });
    return;
  }

  const returnType = $.httpOperation.getReturnType(props.httpOperation);
  const responseRefkey = refkey(props.httpOperation, "http-response");
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
  const signatureParams: ts.ParameterDescriptor[] = [
    {
      name: "client",
      type: clientContextInterfaceRef,
    },
    ...getOperationParameters(props.httpOperation, optionsRefkey),
  ];
  return (
    <List hardline>
      <OperationOptionsDeclaration operation={props.httpOperation} />
      <FunctionDeclaration
        export={!props.internal}
        async
        type={props.httpOperation.operation}
        returnType={<TypeExpression type={returnType} />}
        parametersMode="replace"
        parameters={signatureParams}
        refkey={props.refkey}
      >
        <List hardline>
          <HttpRequest
            httpOperation={props.httpOperation}
            responseRefkey={responseRefkey}
            operationOptionsParamRefkey={optionsRefkey}
          />
          <HttpResponse httpOperation={props.httpOperation} responseRefkey={responseRefkey} />
        </List>
      </FunctionDeclaration>
      ;
    </List>
  );
}
