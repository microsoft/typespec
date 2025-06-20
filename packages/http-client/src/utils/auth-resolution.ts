import { Namespace, Operation, Program } from "@typespec/compiler";
import { Authentication, getAuthentication } from "@typespec/http";
import { getClientFromOperation } from "../client-resolution.js";
import { Client } from "../interfaces.js";
import { StateKeys } from "../lib.js";

export function resolveClientAuthentication(
  program: Program,
  client: Client,
): Authentication | undefined {
  const clientAuthMap = program.stateMap(StateKeys.clientAuthMap);
  if (clientAuthMap.has(client.type)) {
    return clientAuthMap.get(client.type);
  }

  // Authentication defined on the type overrides the one defined on the parents.
  // Check first the client itself
  const clientAuth = getAuthentication(program, client.type);
  if (clientAuth) {
    clientAuthMap.set(client.type, clientAuth);
    return clientAuth;
  }

  // There was no explicit authentication on the client type, check the parent client
  let current: Namespace | undefined = client.type.namespace;
  while (current) {
    if (clientAuthMap.has(current)) {
      return clientAuthMap.get(current);
    }
    const parentAuth = getAuthentication(program, current);
    if (parentAuth) {
      clientAuthMap.set(current, parentAuth);
      return parentAuth;
    }
    current = current.namespace;
  }

  // No authentication was found on the client or its parents, return undefined
  clientAuthMap.set(client.type, undefined);
  return undefined;
}

export function resolveClientOperationAuthentication(
  program: Program,
  operation: Operation,
): Authentication | undefined {
  const clientAuthMap = program.stateMap(StateKeys.clientAuthMap);
  if (clientAuthMap.has(operation)) {
    return clientAuthMap.get(operation);
  }

  // Check if the operation has an explicit authentication
  const operationAuth = getAuthentication(program, operation);
  if (operationAuth) {
    clientAuthMap.set(operation, operationAuth);
    return operationAuth;
  }

  // If not, check the client associated with the operation
  const client = getClientFromOperation(program, operation);
  if (!client) {
    return undefined;
  }

  // Return the resolved authentication for the client that owns the operation.
  const clientAuth = resolveClientAuthentication(program, client);
  clientAuthMap.set(operation, clientAuth);
  return clientAuth;
}
