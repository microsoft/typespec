import { Enum, Model, navigateType, Operation, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as cl from "@typespec/http-client-library";
import { reportDiagnostic } from "../lib.js";
import { prepareOperation } from "./operations.js";

export interface Client extends cl.Client {
  operations: Operation[];
  subClients: Client[];
  parent?: Client;
}

const flattenCache = new WeakMap<Client, Client[]>();

export interface ClientDiscoveryResult {
  client: Client;
  dataTypes: Array<Model | Union | Enum>;
}

export function discoverClients(): ClientDiscoveryResult {
  const rootNs = $.clientLibrary.listNamespaces()[0]; // TODO: Handle multiple namespaces
  const topLevelClient = $.client.getClient(rootNs); // TODO: Handle multiple clients
  const dataTypes = new Set<Model | Union | Enum>();
  const client = visitClient(topLevelClient, dataTypes);

  return {
    client,
    dataTypes: Array.from(dataTypes),
  };
}

const clientOperationCache = new WeakMap<Operation, Client>();

function visitClient(
  client: cl.Client,
  dataTypes: Set<Model | Union | Enum>,
  parent?: Client,
): Client {
  // First create a partial `Client` object.
  // We’ll fill in subClients *after* we have `c`.
  const currentClient: Client = {
    ...client,
    operations: [],
    subClients: [],
    parent,
  };

  // Recurse into sub-clients, passing `currentClient` as the parent
  currentClient.subClients = $.clientLibrary
    .listClients(client)
    .map((childClient) => visitClient(childClient, dataTypes, currentClient));

  // Now store the prepared operations
  currentClient.operations = $.client.listServiceOperations(client).map(prepareOperation);

  // Update caches, collect data types, etc.
  currentClient.operations.forEach((o) => {
    collectDataTypes(o, dataTypes);
    clientOperationCache.set(o, currentClient);
  });

  return currentClient;
}

/**
 * Flatten the client hierarchy into a single-level array,
 * caching the result to avoid recomputing.
 */
export function flattenClients(client: Client): Client[] {
  // If we already have a cached value for this client, return it.
  if (flattenCache.has(client)) {
    return flattenCache.get(client)!;
  }

  // Otherwise, do a DFS/BFS to gather all subClients.
  const result: Client[] = [];
  const stack: Client[] = [client];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    // Add sub-clients to the stack
    stack.push(...current.subClients);
  }

  // Store the result in the cache before returning
  flattenCache.set(client, result);
  return result;
}

function collectDataTypes(type: Type, dataTypes: Set<Model | Union | Enum>) {
  navigateType(
    type,
    {
      model(model) {
        if ($.array.is(model) || $.record.is(model)) {
          return;
        }

        if ($.httpPart.is(model)) {
          const partType = $.httpPart.unpack(model);
          collectDataTypes(partType, dataTypes);
          return;
        }

        if (!model.name) {
          return;
        }

        dataTypes.add(model);
      },
      union(union) {
        if (!union.name) {
          return;
        }

        dataTypes.add(union);
      },
      enum(enum_) {
        if (!enum_.name) {
          return;
        }

        dataTypes.add(enum_);
      },
    },
    { includeTemplateDeclaration: false },
  );
}

export function getClient(operation: Operation): Client {
  const client = clientOperationCache.get(operation);

  if (!client) {
    reportDiagnostic($.program, {
      code: "operation-not-in-client",
      target: operation,
    });
  }

  return client!;
}
