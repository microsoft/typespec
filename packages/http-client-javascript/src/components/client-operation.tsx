import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { HttpRequest } from "./http-request.jsx";
import { HttpResponse } from "./http-response.jsx";

export interface ClientOperationsProps {
  client: cl.Client;
}

export function ClientOperations(props: ClientOperationsProps) {
  const clientOperations = props.client.operations;

  if (clientOperations.length === 0) {
    return null;
  }

  return <ts.SourceFile path={`operations.ts`}>
  {ay.mapJoin(clientOperations, (operation) => {
    return <ClientOperation operation={operation} />;
  })}
</ts.SourceFile>;
}

export interface ClientOperationProps {
  operation: cl.ClientOperation;
}

export function ClientOperation(props: ClientOperationProps) {
  const client = props.operation.client;

  const responseRefkey = ay.refkey(props.operation, "http-response");
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
  const signatureParams = {
    client: clientContextInterfaceRef,
  };
  return <FunctionDeclaration export async type={props.operation.operation} parametersMode="prepend" parameters={signatureParams}>
      <HttpRequest operation={props.operation} responseRefkey={responseRefkey} />
      <HttpResponse operation={props.operation} responseRefkey={responseRefkey} />
    </FunctionDeclaration>;
}
