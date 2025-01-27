import { Enum, Model, Operation, Union } from "@typespec/compiler";
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

export function createClientLibrary(options: CreateClientLibraryOptions = {}): ClientLibrary {
  let topLevel: InternalClient[] = [];
  const dataTypes = new Set<Model | Union | Enum>();

  // Need to find out if we need to create a client for the global namespace.
  const globalNs = $.program.getGlobalNamespaceType();
  const globalClient = $.client.getClient(globalNs);
  const globalOperations = $.client.listServiceOperations(globalClient);
  const globalSubClients = $.clientLibrary.listClients(globalClient);

  if (globalOperations.length !== 0 || globalSubClients.length === 0) {
    // We need to start with the global namespace
    topLevel = [globalClient];
  } else if (globalSubClients.length) {
    for (const client of globalSubClients) {
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
    collectDataTypes(clientOperation.operation, dataTypes);
    const responses = $.httpOperation.getResponses(clientOperation.httpOperation.operation);
    for (const response of responses) {
      const body = response.responseContent.body;
      if (body) {
        collectDataTypes(body.type, dataTypes);
      }
    }
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
