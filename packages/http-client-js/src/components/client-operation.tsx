import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
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
      <ay.For each={clientOperations}>
        {(operation) => (
          <OperationPipeline
            httpOperation={operation.httpOperation}
            pipeline={{ handlers: [PaginatedOperationHandler] }}
          />
        )}
      </ay.For>
    </ts.SourceFile>
  );
}

export interface ClientOperationProps {
  httpOperation: HttpOperation;
  refkey: ay.Refkey;
  internal?: boolean;
}

export function ClientOperation(props: ClientOperationProps) {
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
  const responseRefkey = ay.refkey(props.httpOperation, "http-response");
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
  const signatureParams: ts.ParameterDescriptor[] = [
    { name: "client", type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
    ...getOperationParameters(props.httpOperation),
  ];
  return (
    <ay.List hardline>
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
        <ay.List hardline>
          <HttpRequest httpOperation={props.httpOperation} responseRefkey={responseRefkey} />
          <HttpResponse httpOperation={props.httpOperation} responseRefkey={responseRefkey} />
        </ay.List>
      </FunctionDeclaration>
      ;
    </ay.List>
  );
}
