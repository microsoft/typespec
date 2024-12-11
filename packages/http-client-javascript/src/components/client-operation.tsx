import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
import { prepareOperation } from "../utils/operations.js";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { HttpRequest } from "./http-request.jsx";
import { HttpResponse } from "./http-response.jsx";

export interface ClientOperationsProps {
  client: cl.Client;
}

export function ClientOperations(props: ClientOperationsProps) {
  const clientOperations = $.client.listServiceOperations(props.client);

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
  operation: Operation;
}

export function ClientOperation(props: ClientOperationProps) {
  const client = $.operation.getClient(props.operation)!;

  const jsClientOperation = prepareOperation(props.operation);
  const responseRefkey = ay.refkey(props.operation, "http-response");
  const httpReturnType = $.httpOperation.getReturnType(props.operation);
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
  const signatureParams = {
    client: clientContextInterfaceRef,
  };
  return <FunctionDeclaration export async type={jsClientOperation} parametersMode="prepend" parameters={signatureParams}  returnType={<TypeExpression type={httpReturnType} />}>
      <HttpRequest operation={props.operation} responseRefkey={responseRefkey} />
      <HttpResponse operation={props.operation} responseRefkey={responseRefkey} />
    </FunctionDeclaration>;
}
