import { For, refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { useTsp } from "@typespec/emitter-framework";
import { TypeExpression } from "@typespec/emitter-framework/python";
import * as cl from "@typespec/http-client";
import { useClientLibrary } from "@typespec/http-client";
import { coreHttpModule } from "./external-packages/corehttp.js";

/**
 * Phase-1 stub: for every top-level client (and its sub-clients) emit a Python
 * class with `endpoint`/`credential` fields and one method per operation whose
 * body just raises `NotImplementedError`. Operation bodies, request building,
 * response parsing, auth pipelines, paging, and LRO are deferred.
 */
export function Client() {
  const namePolicy = py.usePythonNamePolicy();
  const { topLevel } = useClientLibrary();

  return (
    <For each={topLevel} hardline>
      {(client) => {
        const fileName = namePolicy.getName(client.name, "module");
        const flatClients = flattenClients(client);
        return (
          <py.SourceFile path={`${fileName}.py`}>
            <For each={flatClients} hardline>
              {(c) => <ClientClass client={c} />}
            </For>
          </py.SourceFile>
        );
      }}
    </For>
  );
}

function flattenClients(client: cl.Client): cl.Client[] {
  return [client, ...client.subClients.flatMap(flattenClients)];
}

export function getClientClassRef(client: cl.Client) {
  return refkey(client.type, "py-client-class");
}

interface ClientClassProps {
  client: cl.Client;
}

function ClientClass(props: ClientClassProps) {
  const { $ } = useTsp();
  const namePolicy = py.usePythonNamePolicy();
  const className = namePolicy.getName($.client.getName(props.client), "class");
  const operations = props.client.operations;
  return (
    <py.ClassDeclaration name={className} refkey={getClientClassRef(props.client)}>
      <py.DunderMethodDeclaration
        name="__init__"
        parameters={[
          { name: "endpoint", type: "str" },
          { name: "credential", type: coreHttpModule.credentials.TokenCredential },
        ]}
      >
        {"self.endpoint = endpoint\nself.credential = credential\n"}
      </py.DunderMethodDeclaration>
      <For each={operations} hardline>
        {(op) => <ClientMethod operation={op.httpOperation.operation} />}
      </For>
    </py.ClassDeclaration>
  );
}

interface ClientMethodProps {
  operation: import("@typespec/compiler").Operation;
}

function ClientMethod(props: ClientMethodProps) {
  const namePolicy = py.usePythonNamePolicy();
  const methodName = namePolicy.getName(props.operation.name, "function");
  const returnTypeNode = <TypeExpression type={props.operation.returnType} />;
  const parameters = Array.from(props.operation.parameters.properties.values()).map((p) => {
    const paramName = namePolicy.getName(p.name, "parameter");
    return {
      name: paramName,
      type: (<TypeExpression type={p.type} />) as any,
      optional: p.optional,
    };
  });
  return (
    <py.MethodDeclaration name={methodName} parameters={parameters} returnType={returnTypeNode}>
      {`raise NotImplementedError("Operation '${props.operation.name}' is not implemented yet")`}
    </py.MethodDeclaration>
  );
}
