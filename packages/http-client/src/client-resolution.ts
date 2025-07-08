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
import { ClientDecoratorOptions } from "../generated-defs/TypeSpec.HttpClient.js";
import { Client, ClientNamePolicy } from "./interfaces.js";
import { createDiagnostic, StateKeys } from "./lib.js";
import { getClientName } from "./utils/get-client-name.js";

export interface ResolveClientsOptions {
  clientNamePolicy?: ClientNamePolicy;
}

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

  program.stateMap(StateKeys.resolvedClient).clear();
  const explicitClientState: Map<Namespace | Interface, ClientDecoratorOptions | undefined> =
    program.stateMap(StateKeys.explicitClient) as any;

  let clients: Client[] = [];
  const decoratedContainers: (Namespace | Interface)[] = [...explicitClientState.keys()];

  if (decoratedContainers.length) {
    clients = decoratedContainers.map((c) => buildClient(program, c, options));
  } else {
    // Ignore clients that have no operations or child namespaces/interfaces.
    const serviceClients = services.filter(
      (service) => hasOperations(service.type) || hasChildrenContainer(service.type),
    );

    clients = serviceClients.map((s) => buildClient(program, s.type, options));
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
  options: ResolveClientsOptions = {},
): Client {
  const clientState = program.stateMap(StateKeys.resolvedClient);
  if (clientState.get(container)) {
    return clientState.get(container)!;
  }

  const client: Client = {
    kind: "client",
    name: container.name,
    operations: [],
    type: container,
    subClients: [],
    parent: undefined,
  };

  clientState.set(container, client);
  client.name = getClientName(program, client, options);
  client.subClients = [...getSubClients(program, client, options)];
  client.operations = [...getClientOperations(program, client)];

  return client;
}

export function getClientFromContainer(
  program: Program,
  container: Namespace | Interface,
): Client | undefined {
  const clientState = program.stateMap(StateKeys.resolvedClient);
  return clientState.get(container);
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
    if (isExplicitClient(program, subNamespace)) {
      // If the sub-namespace is explicitly marked as a client, we skip it as a sub-client.
      continue;
    }
    if (hasOperations(subNamespace) || hasChildrenContainer(subNamespace)) {
      const subClient = buildClient(program, subNamespace, options);
      subClient.parent = client;
      yield subClient;
    }
  }
}

function isExplicitClient(program: Program, container: Namespace | Interface): boolean {
  const explicitClientState: Map<Namespace | Interface, boolean> = program.stateMap(
    StateKeys.explicitClient,
  ) as any;
  return explicitClientState.get(container) !== undefined;
}

function* getClientOperations(program: Program, client: Client): Iterable<Operation> {
  const container = client.type;
  // TODO: handle moveTo/clientLocation?
  const clientOperationMap = program.stateMap(StateKeys.clientOperationMap);
  for (const operation of container.operations.values()) {
    clientOperationMap.set(operation, client);
    yield operation;
  }
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

export function getClientFromOperation(program: Program, operation: Operation): Client | undefined {
  const clientState = program.stateMap(StateKeys.clientOperationMap);
  return clientState.get(operation);
}
