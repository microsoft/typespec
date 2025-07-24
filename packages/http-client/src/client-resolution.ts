import {
  Diagnostic,
  DiagnosticResult,
  Interface,
  isTemplateDeclaration,
  listServices,
  Namespace,
  Operation,
  Program,
} from "@typespec/compiler";
import {
  unsafe_mutateSubgraph,
  unsafe_mutateSubgraphWithNamespace,
  unsafe_Mutator,
  unsafe_MutatorWithNamespace,
} from "@typespec/compiler/experimental";
import { useStateMap } from "@typespec/compiler/utils";
import { listExplicitClients } from "./decorators/client.js";
import { Client, ClientNamePolicy } from "./interfaces.js";
import { createDiagnostic, createStateSymbol } from "./lib.js";
import { buildClientNameMutator } from "./mutators/client-mutator.js";
import { applyNamePolicy } from "./utils/get-client-name.js";

export interface ResolveClientsOptions {
  clientNamePolicy?: ClientNamePolicy;
  mutators?: (unsafe_Mutator | unsafe_MutatorWithNamespace)[];
  emitterScope?: string;
}

export const resolvedClientStateSymbol = createStateSymbol("resolved-client");
const [getResolvedClient, setResolvedClient] = useStateMap<Namespace | Interface, Client>(
  resolvedClientStateSymbol,
);

export { getResolvedClient, setResolvedClient };

/**
 * Resolves the clients in the program.
 * @param program The program to resolve clients for.
 * @param options The options to use when resolving clients.
 * @returns The resolved clients and any diagnostics.
 */
export function resolveClients(
  program: Program,
  options: ResolveClientsOptions = {},
): DiagnosticResult<Client[]> {
  const diagnostics: Diagnostic[] = [];
  const services = listServices(program);

  let clients: Client[] = [];
  const decoratedContainers: (Namespace | Interface)[] = listExplicitClients(program, {
    emitterScope: options.emitterScope,
  });

  if (decoratedContainers.length) {
    clients = decoratedContainers.map((c) => buildClient(program, c, undefined, options));
  } else {
    // Ignore clients that have no operations or child namespaces/interfaces.
    const serviceClients = services.filter(
      (service) => hasOperations(service.type) || hasChildrenContainer(service.type),
    );

    clients = serviceClients.map((s) => buildClient(program, s.type, undefined, options));
  }

  if (clients.length === 0) {
    diagnostics.push(
      createDiagnostic({ code: "no-client-defined", target: program.getGlobalNamespaceType() }),
    );
    return [[], diagnostics];
  }

  return [clients, diagnostics];
}

/**
 * Builds a client for the given container.
 * @param program The program to build the client for.
 * @param container The container to build the client for.
 * @param options The options to use when building the client.
 * @returns The built client.
 */
function buildClient(
  program: Program,
  container: Namespace | Interface,
  parent?: Client,
  options: ResolveClientsOptions = {},
): Client {
  const explicitClient = getResolvedClient(program, container);
  if (explicitClient) {
    return explicitClient;
  }

  let effectiveContainer: Namespace | Interface = container;
  const mutators = [buildClientNameMutator(options.emitterScope), ...(options.mutators ?? [])];
  if (container.kind === "Namespace") {
    effectiveContainer = unsafe_mutateSubgraphWithNamespace(program, mutators, container)
      .type as Namespace;
  } else {
    // For interfaces, we don't mutate the subgraph, but we still apply the mutators.
    effectiveContainer = unsafe_mutateSubgraph(program, mutators, container).type as Interface;
  }

  const client: Client = {
    kind: "client",
    name: effectiveContainer.name,
    type: effectiveContainer,
    subClients: [],
    parent,
  };

  setResolvedClient(program, effectiveContainer, client);
  client.name = applyNamePolicy(program, client, options);
  client.subClients = [...getSubClients(program, client, options)];

  return client;
}

function* getSubClients(
  program: Program,
  client: Client,
  options?: ResolveClientsOptions,
): Iterable<Client> {
  const container = client.type;
  if (container.kind === "Interface") {
    return;
  }

  const childContainers: (Namespace | Interface)[] = [
    ...container.namespaces.values(),
    ...container.interfaces.values(),
  ].filter((e) => (e.kind === "Interface" && isTemplateDeclaration(e) ? false : true));
  for (const subNamespace of childContainers) {
    if (listExplicitClients(program).includes(subNamespace)) {
      // If the sub-namespace is explicitly marked as a client, we skip it as a sub-client.
      continue;
    }
    if (hasOperations(subNamespace) || hasChildrenContainer(subNamespace)) {
      const subClient = buildClient(program, subNamespace, client, options);
      subClient.parent = client;
      yield subClient;
    }
  }
}

// Maps the relationship of clients to their operations.
const clientOperationsMapKey = createStateSymbol("clientOperationsMap");
export const [getClientOperations, setClientOperations, clientOperationsMap] = useStateMap<
  Namespace | Interface,
  Operation[]
>(clientOperationsMapKey);

// Maps the relationship of an operation to its client.
const operationClientMapKey = createStateSymbol("operationClientMap");
export const [getClientFromOperation, setClientForOperation] = useStateMap<Operation, Client>(
  operationClientMapKey,
);

export function resolveClientOperations(program: Program, client: Client): Operation[] {
  const operations: Operation[] = [];
  const container = client.type;
  // TODO: handle moveTo/clientLocation?

  const resolvedOperations = getClientOperations(program, container);
  if (resolvedOperations) {
    // If we already have the operations for this container, return them.
    return resolvedOperations;
  }

  for (const operation of container.operations.values()) {
    setClientForOperation(program, operation, client);
    operations.push(operation);
  }
  setClientOperations(program, container, operations);
  return operations;
}

function hasOperations(namespace: Namespace | Interface): boolean {
  return namespace.operations.size > 0;
}

function hasChildrenContainer(namespace: Namespace | Interface): boolean {
  if (namespace.kind === "Interface") {
    return false;
  }
  return namespace.namespaces.size > 0 || namespace.interfaces.size > 0;
}
