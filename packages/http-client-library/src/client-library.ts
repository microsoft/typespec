import { Enum, Model, Operation, Union } from "@typespec/compiler";
import { unsafe_mutateSubgraph, unsafe_Mutator } from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";
import { Client, ClientOperation, InternalClient } from "./interfaces.js";
import { collectDataTypes } from "./utils/type-collector.js";

export interface ClientLibrary {
  rootClient: Client;
  dataTypes: Array<Model | Union | Enum>;
}

export interface CreateClientLibraryOptions {
  operationMutators?: unsafe_Mutator[];
}

export function createClientLibrary(options: CreateClientLibraryOptions = {}): ClientLibrary {
  const rootNs = $.clientLibrary.listNamespaces()[0]; // TODO: Handle multiple namespaces
  const topLevelClient = $.client.getClient(rootNs); // TODO: Handle multiple clients
  const dataTypes = new Set<Model | Union | Enum>();
  const client = visitClient(topLevelClient, dataTypes, {
    operationMutators: options.operationMutators,
  });

  return {
    rootClient: client,
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
  currentClient.operations.forEach((o) => {
    const returnType = $.httpOperation.getReturnType(o.httpOperation.operation);
    collectDataTypes(returnType, dataTypes);
    collectDataTypes(o.operation, dataTypes);
  });

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
