import { Enum, Model, Namespace, Program, Union } from "@typespec/compiler";
import { unsafe_Mutator } from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";
import { HttpOperation } from "@typespec/http";
import { Client, InternalClient } from "./interfaces.js";
import { reportDiagnostic } from "./lib.js";
import { collectDataTypes } from "./utils/type-collector.js";

export interface ClientLibrary {
  topLevel: Client[];
  dataTypes: Array<Model | Union | Enum>;
  getClientForOperation(operation: HttpOperation): Client | undefined;
}

export interface CreateClientLibraryOptions {
  operationMutators?: unsafe_Mutator[];
}

function hasGlobalOperations(program: Program, namespace: Namespace): boolean {
  const tk = $(program);
  for (const operation of namespace.operations.values()) {
    if (tk.type.isUserDefined(operation)) {
      return true;
    }
  }

  return false;
}

function getUserDefinedSubClients(program: Program, namespace: Namespace): InternalClient[] {
  const tk = $(program);
  const clients: InternalClient[] = [];

  for (const subNs of namespace.namespaces.values()) {
    if (!tk.type.isUserDefined(subNs)) {
      continue;
    }
    const client = getEffectiveClient(program, subNs);
    if (client) {
      clients.push(client);
    }
  }

  return clients;
}

function getEffectiveClient(program: Program, namespace: Namespace): InternalClient | undefined {
  const tk = $(program);
  if (namespace.operations.size > 0 || namespace.interfaces.size > 0) {
    // It has content so it should be a client
    return tk.client.getClient(namespace);
  }

  const effectiveClients: InternalClient[] = [];

  // It has no content so we need to check its children
  for (const subNs of namespace.namespaces.values()) {
    const client = getEffectiveClient(program, subNs);
    if (client) {
      effectiveClients.push(client);
    }
  }

  if (effectiveClients.length > 1) {
    // If there are more than one sub client we can't collapse so we need to create a client for this namespace
    return tk.client.getClient(namespace);
  }

  if (effectiveClients.length === 1) {
    return effectiveClients[0];
  }

  return undefined;
}

const operationClientMap = new Map<Program, Map<HttpOperation, Client>>();

export function createClientLibrary(
  program: Program,
  options: CreateClientLibraryOptions = {},
): ClientLibrary {
  const tk = $(program);

  if (!operationClientMap.has(program)) {
    operationClientMap.set(program, new Map<HttpOperation, Client>());
  }

  let topLevel: InternalClient[] = [];
  const dataTypes = new Set<Model | Union | Enum>();

  // Need to find out if we need to create a client for the global namespace.
  const globalNs = tk.program.getGlobalNamespaceType();

  const userDefinedTopLevelClients = getUserDefinedSubClients(program, globalNs);
  if (hasGlobalOperations(program, globalNs)) {
    // We need to start with the global namespace
    const globalClient = tk.client.getClient(globalNs);
    topLevel = [globalClient];
  } else if (userDefinedTopLevelClients.length > 0) {
    for (const client of userDefinedTopLevelClients) {
      topLevel.push(client);
    }
  }

  const topLevelClients: Client[] = [];

  if (topLevel.length === 0) {
    reportDiagnostic(tk.program, { code: "cant-find-client", target: globalNs });
  }

  for (const c of topLevel) {
    const client = visitClient(program, c, dataTypes, {
      operationMutators: options.operationMutators,
    });
    topLevelClients.push(client);
  }

  return {
    topLevel: topLevelClients,
    dataTypes: Array.from(dataTypes),
    getClientForOperation(operation: HttpOperation) {
      return operationClientMap.get(program)?.get(operation);
    },
  };
}

interface VisitClientOptions {
  operationMutators?: unsafe_Mutator[];
  parentClient?: Client;
}
function visitClient(
  program: Program,
  client: InternalClient,
  dataTypes: Set<Model | Union | Enum>,
  options?: VisitClientOptions,
): Client {
  const tk = $(program);
  // First create a partial `Client` object.
  // We’ll fill in subClients *after* we have `c`.
  const currentClient: Client = {
    ...client,
    operations: [],
    subClients: [],
    parent: options?.parentClient,
  };

  // Recurse into sub-clients, passing `currentClient` as the parent
  currentClient.subClients = tk.clientLibrary.listClients(client).map((childClient) =>
    visitClient(program, childClient, dataTypes, {
      parentClient: currentClient,
      operationMutators: options?.operationMutators,
    }),
  );

  // Now store the prepared operations
  currentClient.operations = tk.client.listHttpOperations(client).map((o) => {
    operationClientMap.get(program)?.set(o, currentClient);

    return {
      client: currentClient,
      httpOperation: o,
      kind: "ClientOperation",
      name: o.operation.name,
    };
  });

  tk.client
    .getConstructor(currentClient)
    .parameters.properties.forEach((p) => collectDataTypes(tk, p.type, dataTypes));

  // Collect data types
  for (const clientOperation of currentClient.operations) {
    // Collect operation parameters
    collectDataTypes(tk, clientOperation.httpOperation.operation.parameters, dataTypes);

    // Collect http operation return type
    const responseType = tk.httpOperation.getReturnType(clientOperation.httpOperation);
    collectDataTypes(tk, responseType, dataTypes);
  }

  return currentClient;
}
