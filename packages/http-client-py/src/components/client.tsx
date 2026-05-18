import { For, refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { useTsp } from "@typespec/emitter-framework";
import * as cl from "@typespec/http-client";
import { useClientLibrary } from "@typespec/http-client";
import { coreHttpModule } from "./external-packages/corehttp.js";
import { renderClientOperation } from "./operations/index.js";

/**
 * Phase-1+ stub: for every top-level client (and its sub-clients) emit a
 * Python class with `endpoint`/`credential` fields. Each TypeSpec operation
 * is rendered by dispatching through the {@link renderClientOperation}
 * registry, which currently knows how to emit two flavors:
 *
 * - `basic` — a stub `def foo(...)` that raises `NotImplementedError`.
 * - `lro` — a `begin_foo(...) -> LROPoller[T]` pair (public + `_foo_initial`).
 *
 * Real HTTP wiring, request building, paging, and async variants come later.
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
        {(op) => renderClientOperation(op)}
      </For>
    </py.ClassDeclaration>
  );
}
