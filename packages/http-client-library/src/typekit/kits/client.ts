import {
  getService,
  Interface,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";
import { Client } from "../../interfaces.js";
import { createBaseConstructor, getConstructors } from "../../utils/client-helpers.js";
import { NameKit } from "./utils.js";

interface ClientKit extends NameKit<Client> {
  /**
   * Get the parent of a client
   * @param type The client to get the parent of
   */
  getParent(type: Client | Namespace | Interface): Client | undefined;
  /**
   * Flatten a client into a list of clients. This will include the client and all its sub clients recursively.
   * @param client The client to flatten
   */
  flat(client: Client): Client[];
  /**
   * Get a client from a single namespace / interface
   */
  getClient(namespace: Namespace | Interface): Client;
  /**
   * Get the constructor for a client. Will return the base intersection of all possible constructors.
   *
   * If you'd like to look at overloads, call `$.operation.getOverloads` on the result of this function.
   *
   * @param client The client we're getting constructors for
   */
  getConstructor(client: Client): Operation;

  /**
   * Whether the client is publicly initializable
   */
  isPubliclyInitializable(client: Client): boolean;

  /**
   * Return the methods on the client
   *
   * @param client the client to get the methods for
   */
  listServiceOperations(client: Client): Operation[];

  /**
   * Get the url template of a client, given its constructor as well */
  getUrlTemplate(client: Client, constructor: Operation): string;
}

interface TypeKit {
  client: ClientKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypekitPrototype extends TypeKit {}
}

function getClientName(name: string): string {
  return name.endsWith("Client") ? name : `${name}Client`;
}

export const clientCache = new Map<Namespace | Interface, Client>();
export const clientOperationCache = new Map<Client, Operation[]>();

defineKit<TypeKit>({
  client: {
    getParent(client) {
      const type = client.kind === "Client" ? client.type : client;
      if (type.namespace && type.namespace !== $.program.getGlobalNamespaceType()) {
        return this.client.getClient(type.namespace);
      }

      return undefined;
    },
    flat(client) {
      const clientStack = [client];
      const clients: Client[] = [];
      while (clientStack.length > 0) {
        const currentClient = clientStack.pop();
        if (currentClient) {
          clients.push(currentClient);
          clientStack.push(...$.clientLibrary.listClients(currentClient));
        }
      }
      return clients;
    },
    getClient(namespace) {
      if (clientCache.has(namespace)) {
        return clientCache.get(namespace)!;
      }

      const client = {
        kind: "Client",
        name: getClientName(namespace.name),
        service: namespace,
        type: namespace,
      } as Client;

      clientCache.set(namespace, client);
      return client;
    },
    getConstructor(client) {
      const constructors = getConstructors(client);
      if (constructors.length === 1) {
        return constructors[0];
      }
      return createBaseConstructor(client, constructors);
    },
    getName(client) {
      return client.name;
    },
    isPubliclyInitializable(client) {
      return client.type.kind === "Namespace";
    },
    listServiceOperations(client) {
      if (clientOperationCache.has(client)) {
        return clientOperationCache.get(client)!;
      }

      const operations: Operation[] = [];

      function addOperations(current: Namespace | Interface) {
        if (
          current.kind === "Namespace" &&
          current !== client.type &&
          getService($.program, current)
        ) {
          // if I'm a different service, I'm done
          return;
        }
        if (current.kind === "Interface" && isTemplateDeclaration(current)) {
          // Skip template interface operations
          return;
        }

        for (const op of current.operations.values()) {
          // Skip templated operations
          if (!isTemplateDeclarationOrInstance(op)) {
            operations.push(op);
          }
        }
      }

      addOperations(client.type);

      clientOperationCache.set(client, operations);
      return operations;
    },
    getUrlTemplate(client, constructor) {
      const params = $.operation.getClientSignature(client, constructor);
      const endpointParams = params
        .filter(
          (p) => $.modelProperty.getName(p) === "endpoint" || $.modelProperty.isHttpPathParam(p),
        )
        .map((p) => p.name)
        .sort();
      if (endpointParams.length === 1) {
        return "{endpoint}";
      }
      // here we have multiple templated arguments to an endpoint
      const servers = getServers($.program, client.service) || [];
      for (const server of servers) {
        const serverParams = [...server.parameters.values()].map((p) => p.name).sort();
        if (JSON.stringify(serverParams) === JSON.stringify(endpointParams)) {
          // this is the server we want
          return server.url;
        }
      }
      return "{endpoint}";
    },
  },
});
