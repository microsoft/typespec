import { listServices, Namespace, Program, Service, Type, Value } from "@typespec/compiler";
import { ClientV2 } from "../interfaces.js";
import { StateKeys } from "../lib.js";

export interface ClientServer {
  url: string;
  description?: string;
  variables?: Record<string, ClientServerVariable>;
}

export interface ClientServerVariable {
  enum?: string[];
  defaultValue: Value;
  description?: string;
}

/**
 * Get the service associated with a client.
 * @param program The program instance.
 * @param client The client instance.
 * @returns The service associated with the client, or undefined if not found.
 */
export function getService(program: Program, client: ClientV2): Service | undefined {
  const clientServiceMap: Map<Type, Service | undefined> = program.stateMap(
    StateKeys.clientServiceMap,
  );
  if (clientServiceMap.has(client.type)) {
    return clientServiceMap.get(client.type);
  }

  const services = listServices(program);
  let current: Namespace | undefined =
    client.type.kind === "Interface" ? client.type.namespace! : client.type;

  let service: Service | undefined;
  while (current) {
    service = services.find((s) => s.type === current);
    if (service) {
      break;
    }
    current = current.namespace;
  }

  clientServiceMap.set(client.type, service);
  return service;
}
