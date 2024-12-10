import { Children, mapJoin, refkey, SourceDirectory } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Operation, Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import { prepareOperation } from "../utils/operations.js";
import { getClientcontextDeclarationRef } from "./client-context/client-context-declaration.jsx";
import { HttpRequest } from "./http-request.js";
import { HttpResponse } from "./http-response.jsx";

export interface OperationsProps {
  operations: Map<string, Operation[]>;
  service?: Service;
}

export function Operations(props: OperationsProps) {
  const namePolicy = ts.createTSNamePolicy();
  return mapJoin(
    props.operations,
    (key, operations) => {
      const containerParts = (key.split("/") ?? []).filter((p) => p !== props.service?.type.name);
      const subPathExport = ["api", ...containerParts]
        .map((p) => namePolicy.getName(p, "interface-member"))
        .join("/");
      return getSourceDirectory(
        containerParts,
        <><ts.BarrelFile export={subPathExport} /><OperationsFile path="operations.ts" operations={operations} service={props.service} /></>,
      );
    },
    { joiner: "\n\n" },
  );
}

function getSourceDirectory(directoryPath: string[], children: Children) {
  const currentPath = [...directoryPath];
  const current = currentPath.shift();

  if (!current) {
    return children;
  }

  const namePolicy = ts.createTSNamePolicy();
  const directoryName = namePolicy.getName(current, "variable");

  return <SourceDirectory path={directoryName}>
      {getSourceDirectory(currentPath, children)}
    </SourceDirectory>;
}

export interface OperationsFileProps {
  path: string;
  operations: Operation[];
  service?: Service;
}

export function OperationsFile(props: OperationsFileProps) {
  if (!props.service) {
    return null;
  }

  const client = $.client.getClient(props.service.type)!;

  return <ts.SourceFile path={props.path}>
      {mapJoin(props.operations, (o) => {
        const preparedOperation = prepareOperation(o);
        const clientContextDeclarationRef = getClientcontextDeclarationRef(client)
        const httpReturnType = $.httpOperation.getReturnType(preparedOperation);
        const responseRefkey = refkey();
        const signatureParams = {  "client": clientContextDeclarationRef.component};
        return (
          <FunctionDeclaration export async type={preparedOperation} returnType={httpReturnType ?<TypeExpression type={httpReturnType} /> : "void"} parameters={signatureParams}>
            <HttpRequest operation={o} responseRefkey={responseRefkey} />
            <HttpResponse operation={o} responseRefkey={responseRefkey} />
          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>;
}
