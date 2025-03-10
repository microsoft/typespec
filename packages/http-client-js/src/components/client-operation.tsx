import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { HttpRequest } from "./http-request.jsx";
import { HttpResponse } from "./http-response.jsx";
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
        {(operation) => <ClientOperation clientOperation={operation} />}
      </ay.For>
    </ts.SourceFile>
  );
}

export interface ClientOperationProps {
  clientOperation: cl.ClientOperation;
}

export function ClientOperation(props: ClientOperationProps) {
  const client = props.clientOperation.client;
  const returnType = $.httpOperation.getReturnType(props.clientOperation.httpOperation);
  const responseRefkey = ay.refkey(props.clientOperation, "http-response");
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
  const signatureParams: Record<string, ts.ParameterDescriptor | ay.Children> = {
    client: { type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
    ...getOperationParameters(props.clientOperation.httpOperation),
  };
  return (
    <>
      <OperationOptionsDeclaration operation={props.clientOperation.httpOperation} />
      <FunctionDeclaration
        export
        async
        type={props.clientOperation.httpOperation.operation}
        returnType={<TypeExpression type={returnType} />}
        parametersMode="replace"
        parameters={signatureParams}
      >
        <HttpRequest operation={props.clientOperation} responseRefkey={responseRefkey} />
        <HttpResponse operation={props.clientOperation} responseRefkey={responseRefkey} />
      </FunctionDeclaration>
      ;
    </>
  );
}
