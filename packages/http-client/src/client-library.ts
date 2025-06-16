import { Enum, ignoreDiagnostics, Model, Program, Union } from "@typespec/compiler";
import { unsafe_Mutator } from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";
import { resolveClientInitialization } from "./client-initialization-resolution.js";
import { ResolveClientsOptions } from "./client-resolution.js";
import { Client } from "./interfaces.js";
import { collectDataTypes } from "./utils/type-collector.js";

export interface ClientLibrary {
  topLevel: Client[];
  dataTypes: Array<Model | Union | Enum>;
}

export interface CreateClientLibraryOptions {
  clientResolution?: ResolveClientsOptions;
  operationMutators?: unsafe_Mutator[];
}

export function createClientLibrary(
  program: Program,
  options: CreateClientLibraryOptions = {},
): ClientLibrary {
  const tk = $(program);

  const dataTypes = new Set<Model | Union | Enum>();
  const topLevelClients: Client[] = tk.client.list(options.clientResolution);

  for (const client of topLevelClients) {
    visitClient(program, client, dataTypes);
  }
  return {
    topLevel: topLevelClients,
    dataTypes: Array.from(dataTypes),
  };
}

function visitClient(program: Program, client: Client, dataTypes: Set<Model | Union | Enum>): void {
  const tk = $(program);

  visitClientServers(program, client, dataTypes);

  // Collect data types
  for (const operation of client.operations) {
    // Collect operation parameters
    collectDataTypes(tk, operation.parameters, dataTypes);

    // Collect http operation return type
    const httpOperation = tk.httpOperation.get(operation);
    const responseType = tk.httpOperation.getReturnType(httpOperation);
    collectDataTypes(tk, responseType, dataTypes);
  }

  for (const subClient of client.subClients) {
    visitClient(program, subClient, dataTypes);
  }
}

function visitClientServers(
  program: Program,
  client: Client,
  dataTypes: Set<Model | Union | Enum>,
): void {
  const initialization = ignoreDiagnostics(resolveClientInitialization(program, client));
  for (const server of initialization.endpoints ?? []) {
    for (const parameter of server.parameters.values()) {
      collectDataTypes($(program), parameter, dataTypes);
    }
  }
}
