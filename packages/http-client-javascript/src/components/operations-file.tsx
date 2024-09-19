import { Children, mapJoin, refkey, SourceDirectory } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { mutateSubgraph, Mutator, MutatorFlow, Operation, Service } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import { ClientContextRefkey } from "./client-context.jsx";
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
      const containerParts = key.split("/") ?? [];
      const subPathExport = ["api", ...containerParts]
        .map((p) => namePolicy.getName(p, "interface-member"))
        .join("/");
      return getSourceDirectory(
        containerParts,
        <><ts.BarrelFile export={subPathExport} /><OperationsFile path="operations.ts" operations={operations} service={props.service} /></>
      );
    },
    { joiner: "\n\n" }
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

  return <ts.SourceFile path={props.path}>
      {mapJoin(props.operations, (o) => {
        const mutatedOperation = mutateSubgraph($.program, [httpParamsMutator], o).type as Operation;
        const httpReturnType = $.httpOperation.getReturnType(mutatedOperation);
        const responseRefkey = refkey();
        const signatureParams = {  "client": <ts.Reference refkey={ClientContextRefkey}/>};
        return (
          <FunctionDeclaration export async type={mutatedOperation} returnType={httpReturnType ?<TypeExpression type={httpReturnType} /> : "void"} parameters={signatureParams}>
            <HttpRequest operation={o} responseRefkey={responseRefkey} />
            <HttpResponse operation={o} responseRefkey={responseRefkey} />
          </FunctionDeclaration>
        );
      }, {joiner: "\n\n"})}
    </ts.SourceFile>;
}

/**
 * Mutates the operation so that the parameters model is split into required and optional parameters.
 */
const httpParamsMutator: Mutator = {
  name: "Http parameters",
  Operation: {
    filter() {
      return MutatorFlow.DontRecurse;
    },
    mutate(o, clone, _program, realm) {
      const httpOperation = $.httpOperation.get(o);
      const params = $.httpRequest.getParameters(httpOperation, [
        "query",
        "header",
        "path",
        "body",
        "contentType",
      ]);

      if (!params) {
        return;
      }

      clone.parameters = params;

      const optionals = [...clone.parameters.properties.values()].filter((p) => p.optional);

      if (optionals.length === 0) {
        return;
      }

      const optionsBag = realm.typeFactory.model("", optionals);
      const optionsProp = realm.typeFactory.modelProperty("options", optionsBag, {
        optional: true,
      });

      for (const [key, prop] of clone.parameters.properties) {
        if (prop.optional) {
          clone.parameters.properties.delete(key);
        }
      }

      clone.parameters.properties.set("options", optionsProp);
    },
  },
};
