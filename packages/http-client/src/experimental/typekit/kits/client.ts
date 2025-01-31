import {
  getService,
  Interface,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  Namespace,
  NoTarget,
  Operation,
} from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/experimental/typekit";
import { getServers } from "@typespec/http";
import { InternalClient } from "../../../interfaces.js";
import { reportDiagnostic } from "../../../lib.js";
import { createBaseConstructor, getConstructors } from "../../../utils/client-helpers.js";
import { NameKit } from "./utils.js";

interface ClientKit extends NameKit<InternalClient> {
  /**
   * Get the parent of a client
   * @param type The client to get the parent of
   */
  getParent(type: InternalClient | Namespace | Interface): InternalClient | undefined;
  /**
   * Flatten a client into a list of clients. This will include the client and all its sub clients recursively.
   * @param client The client to flatten
   */
  flat(client: InternalClient): InternalClient[];
  /**
   * Get a client from a single namespace / interface
   */
  getClient(namespace: Namespace | Interface): InternalClient;
  /**
   * Get the constructor for a client. Will return the base intersection of all possible constructors.
   *
   * If you'd like to look at overloads, call `this.operation.getOverloads` on the result of this function.
   *
   * @param client The client we're getting constructors for
   */
  getConstructor(client: InternalClient): Operation;

  /**
   * Whether the client is publicly initializeable
   */
  isPubliclyInitializeable(client: InternalClient): boolean;

  /**
   * Return the methods on the client
   *
   * @param client the client to get the methods for
   */
  listServiceOperations(client: InternalClient): Operation[];

  /**
   * Get the url template of a client, given its constructor as well */
  getUrlTemplate(client: InternalClient, constructor: Operation): string;
  /**
   * Determines is both clients have the same constructor
   */
  haveSameConstructor(a: InternalClient, b: InternalClient): boolean;
}

interface TypeKit {
  client: ClientKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypeKit {}
}

function getClientName(name: string): string {
  return name.endsWith("Client") ? name : `${name}Client`;
}

export const clientCache = new Map<Namespace | Interface, InternalClient>();
export const clientOperationCache = new Map<InternalClient, Operation[]>();

defineKit<TypeKit>({
  client: {
    getParent(client) {
      const type = client.kind === "Client" ? client.type : client;
      if (type.namespace && type.namespace !== this.program.getGlobalNamespaceType()) {
        return this.client.getClient(type.namespace);
      }

      return undefined;
    },
    flat(client) {
      const clientStack = [client];
      const clients: InternalClient[] = [];
      while (clientStack.length > 0) {
        const currentClient = clientStack.pop();
        if (currentClient) {
          clients.push(currentClient);
          clientStack.push(...this.clientLibrary.listClients(currentClient));
        }
      }
      return clients;
    },
    getClient(namespace) {
      if (!namespace) {
        reportDiagnostic(this.program, {
          code: "undefined-namespace-for-client",
          target: NoTarget,
        });
      }
      if (clientCache.has(namespace)) {
        return clientCache.get(namespace)!;
      }

      const client = {
        kind: "Client",
        name: getClientName(namespace.name),
        service: namespace,
        type: namespace,
      } as InternalClient;

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
    isPubliclyInitializeable(client) {
      return client.type.kind === "Namespace";
    },
    listServiceOperations(client) {
      if (clientOperationCache.has(client)) {
        return clientOperationCache.get(client)!;
      }

      const operations: Operation[] = [];

      function addOperations(_$: any, current: Namespace | Interface) {
        if (
          current.kind === "Namespace" &&
          current !== client.type &&
          getService(_$.program, current)
        ) {
          // if I'm a different service, I'm done
          return;
        }
        if (current.kind === "Interface" && isTemplateDeclaration(current)) {
          // Skip template interface operations
          return;
        }

        for (const op of current.operations.values()) {
          const clientOperation = _$.type.clone(op);
          const returnType = _$.httpOperation.getReturnType(op);
          clientOperation.returnType = returnType;
          _$.program.checker.finishType(clientOperation);

          // Skip templated operations
          if (!isTemplateDeclarationOrInstance(clientOperation)) {
            operations.push(clientOperation);
          }
        }
      }

      addOperations(this, client.type);

      clientOperationCache.set(client, operations);
      return operations;
    },
    getUrlTemplate(client, constructor) {
      const params = this.operation.getClientSignature(client, constructor);
      const endpointParams = params
        .filter(
          (p) =>
            this.modelProperty.getName(p) === "endpoint" || this.modelProperty.isHttpPathParam(p),
        )
        .map((p) => p.name)
        .sort();
      if (endpointParams.length === 1) {
        return "{endpoint}";
      }
      // here we have multiple templated arguments to an endpoint
      const servers = getServers(this.program, client.service) || [];
      for (const server of servers) {
        const serverParams = [...server.parameters.values()].map((p) => p.name).sort();
        if (JSON.stringify(serverParams) === JSON.stringify(endpointParams)) {
          // this is the server we want
          return server.url;
        }
      }
      return "{endpoint}";
    },
    haveSameConstructor(a, b) {
      const aConstructor = this.client.getConstructor(a);
      const bConstructor = this.client.getConstructor(b);

      const bParams = [...bConstructor.parameters.properties.values()];
      const aParams = [...aConstructor.parameters.properties.values()];

      if (bParams.length !== aParams.length) {
        return false;
      }

      for (let i = 0; i < aParams.length; i++) {
        if (bParams[i].type !== aParams[i].type) {
          return false;
        }
      }

      return true;
    },
  },
});
