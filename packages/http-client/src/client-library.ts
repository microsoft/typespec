import { Enum, Model, Namespace, Operation, Union } from "@typespec/compiler";
import { unsafe_mutateSubgraph, unsafe_Mutator } from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/experimental/typekit";
import { Client, ClientOperation, InternalClient } from "./interfaces.js";
import { reportDiagnostic } from "./lib.js";
import { collectDataTypes } from "./utils/type-collector.js";

export interface ClientLibrary {
  topLevel: Client[];
  dataTypes: Array<Model | Union | Enum>;
}

export interface CreateClientLibraryOptions {
  operationMutators?: unsafe_Mutator[];
}

function hasGlobalOperations(namespace: Namespace): boolean {
  for (const operation of namespace.operations.values()) {
    if ($.type.isUserDefined(operation)) {
      return true;
    }
  }

  return false;
}

function getUserDefinedSubClients(namespace: Namespace): InternalClient[] {
  const clients: InternalClient[] = [];

  for (const subNs of namespace.namespaces.values()) {
    if (!$.type.isUserDefined(subNs)) {
      continue;
    }
    const client = getEffectiveClient(subNs);
    if (client) {
      clients.push(client);
    }
  }

  return clients;
}

function getEffectiveClient(namespace: Namespace): InternalClient | undefined {
  if (namespace.operations.size > 0 || namespace.interfaces.size > 0) {
    // It has content so it should be a client
    return $.client.getClient(namespace);
  }

  const effectiveClients: InternalClient[] = [];

  // It has no content so we need to check its children
  for (const subNs of namespace.namespaces.values()) {
    const client = getEffectiveClient(subNs);
    if (client) {
      effectiveClients.push(client);
    }
  }

  if (effectiveClients.length > 1) {
    // If there are more than one sub client we can't collapse so we need to create a client for this namespace
    return $.client.getClient(namespace);
  }

  if (effectiveClients.length === 1) {
    return effectiveClients[0];
  }

  return undefined;
}

export function createClientLibrary(options: CreateClientLibraryOptions = {}): ClientLibrary {
  let topLevel: InternalClient[] = [];
  const dataTypes = new Set<Model | Union | Enum>();

  // Need to find out if we need to create a client for the global namespace.
  const globalNs = $.program.getGlobalNamespaceType();

  const userDefinedTopLevelClients = getUserDefinedSubClients(globalNs);
  if (hasGlobalOperations(globalNs)) {
    // We need to start with the global namespace
    const globalClient = $.client.getClient(globalNs);
    topLevel = [globalClient];
  } else if (userDefinedTopLevelClients.length > 0) {
    for (const client of userDefinedTopLevelClients) {
      topLevel.push(client);
    }
  }

  const topLevelClients: Client[] = [];

  if (topLevel.length === 0) {
    reportDiagnostic($.program, { code: "cant-find-client", target: globalNs });
  }

  for (const c of topLevel) {
    const client = visitClient(c, dataTypes, { operationMutators: options.operationMutators });
    topLevelClients.push(client);
  }

  return {
    topLevel: topLevelClients,
    dataTypes: Array.from(dataTypes),
  };
}

interface VisitClientOptions {
  operationMutators?: unsafe_Mutator[];
  parentClient?: Client;
}
function visitClient(
  client: InternalClient,
  dataTypes: Set<Model | Union | Enum>,
  options?: VisitClientOptions,
): Client {
  // First create a partial `Client` object.
  // We’ll fill in subClients *after* we have `c`.
  const currentClient: Client = {
    ...client,
    operations: [],
    subClients: [],
    parent: options?.parentClient,
  };

  // Recurse into sub-clients, passing `currentClient` as the parent
  currentClient.subClients = $.clientLibrary.listClients(client).map((childClient) =>
    visitClient(childClient, dataTypes, {
      parentClient: currentClient,
      operationMutators: options?.operationMutators,
    }),
  );

  // Now store the prepared operations
  currentClient.operations = $.client
    .listServiceOperations(client)
    .map((o) => prepareOperation(currentClient, o, { mutators: options?.operationMutators }));

  // Collect data types
  for (const clientOperation of currentClient.operations) {
    // Collect operation parameters
    collectDataTypes(clientOperation.operation.parameters, dataTypes);

    // Collect http operation return type
    const responseType = $.httpOperation.getReturnType(clientOperation.httpOperation);
    collectDataTypes(responseType, dataTypes);
  }

  return currentClient;
}

interface PrepareClientOperationOptions {
  mutators?: unsafe_Mutator[];
}

function prepareOperation(
  client: Client,
  operation: Operation,
  options: PrepareClientOperationOptions = {},
): ClientOperation {
  let op: Operation = operation;

  // We need to get the HttpOperation before running mutators to ensure that the httpOperation has full fidelity with the spec
  const httpOperation = $.httpOperation.get(op);

  if (options.mutators) {
    op = unsafe_mutateSubgraph($.program, options.mutators, operation).type as Operation;
  }

  return {
    kind: "ClientOperation",
    client,
    httpOperation,
    name: op.name,
    operation: op,
  };
}
