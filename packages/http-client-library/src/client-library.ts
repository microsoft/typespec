import { Enum, Model, Namespace, Operation, Union } from "@typespec/compiler";
import { unsafe_mutateSubgraph, unsafe_Mutator } from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";
import { Client, ClientOperation, InternalClient } from "./interfaces.js";
import { collectDataTypes } from "./utils/type-collector.js";

export interface ClientLibrary {
  topLevel: Client[];
  dataTypes: Array<Model | Union | Enum>;
}

export interface CreateClientLibraryOptions {
  operationMutators?: unsafe_Mutator[];
}

function hasTopLevelOperations(namespace: Namespace): boolean {
  for (const operation of namespace.operations.values()) {
    if ($.type.isUserDefined(operation)) {
      return true;
    }
  }

  return false;
}

function hasUserDefinedClients(namespace: Namespace): boolean {
  for (const client of namespace.namespaces.values()) {
    if ($.type.isUserDefined(client)) {
      return true;
    }
  }

  for (const iface of namespace.interfaces.values()) {
    if ($.type.isUserDefined(iface)) {
      return true;
    }
  }

  return false;
}

function getUserDefinedSubClients(namespace: Namespace): InternalClient[] {
  const clients: InternalClient[] = [];

  for (const subNs of [...namespace.namespaces.values(), ...namespace.interfaces.values()]) {
    if ($.type.isUserDefined(subNs)) {
      clients.push($.client.getClient(subNs));
    }
  }

  return clients;
}

export function createClientLibrary(options: CreateClientLibraryOptions = {}): ClientLibrary {
  let topLevel: InternalClient[] = [];
  const dataTypes = new Set<Model | Union | Enum>();

  // Need to find out if we need to create a client for the global namespace.
  const globalNs = $.program.getGlobalNamespaceType();

  if (hasTopLevelOperations(globalNs) || !hasUserDefinedClients(globalNs)) {
    // We need to start with the global namespace
    const globalClient = $.client.getClient(globalNs);
    topLevel = [globalClient];
  } else if (hasUserDefinedClients(globalNs)) {
    const subClients = getUserDefinedSubClients(globalNs);
    for (const client of subClients) {
      topLevel.push(client);
    }
  }

  const topLevelClients: Client[] = [];

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
