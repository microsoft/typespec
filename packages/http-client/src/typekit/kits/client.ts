import {
  Interface,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  ModelProperty,
  Namespace,
  NoTarget,
  Operation,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/experimental/typekit";
import {
  getHttpService,
  getServers,
  HttpOperation,
  HttpServer,
  HttpServiceAuthentication,
  resolveAuthentication,
} from "@typespec/http";
import "@typespec/http/experimental/typekit";
import { InternalClient } from "../../interfaces.js";
import { reportDiagnostic } from "../../lib.js";
import { createBaseConstructor, getConstructors } from "../../utils/client-helpers.js";
import { getStringValue } from "../../utils/helpers.js";
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
   * Whether the client can be initialized publicly
   */
  isPubliclyInitializable(client: InternalClient): boolean;

  /**
   * Return the methods on the client
   *
   * @param client the client to get the methods for
   */
  listHttpOperations(client: InternalClient): HttpOperation[];

  /**
   * Get the url template of a client, given its constructor as well */
  getUrlTemplate(
    client: InternalClient,
    constructor?: Operation,
  ): { url: string; parameters: ModelProperty[] };
  /**
   * Determines is both clients have the same constructor
   */
  haveSameConstructor(a: InternalClient, b: InternalClient): boolean;
  /**
   * Resolves the authentication schemes for a client
   * @param client
   */
  getAuth(client: InternalClient): HttpServiceAuthentication;
  /**
   * Lists servers for a client or its closest parent's sever
   * @param client client to check for servers
   */
  listServers(client: InternalClient): HttpServer[] | undefined;
}

interface TypekitExtension {
  client: ClientKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypekitExtension {}
}

function getClientName(name: string): string {
  return name.endsWith("Client") ? name : `${name}Client`;
}

export const clientCache = new Map<Namespace | Interface, InternalClient>();
export const clientOperationCache = new Map<InternalClient, HttpOperation[]>();

defineKit<TypekitExtension>({
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
    isPubliclyInitializable(client) {
      return client.type.kind === "Namespace";
    },
    listHttpOperations(client) {
      if (clientOperationCache.has(client)) {
        return clientOperationCache.get(client)!;
      }

      if (client.type.kind === "Interface" && isTemplateDeclaration(client.type)) {
        // Skip template interface operations
        return [];
      }

      const operations: Operation[] = [];

      for (const clientOperation of client.type.operations.values()) {
        // Skip templated operations
        if (isTemplateDeclarationOrInstance(clientOperation)) {
          continue;
        }

        operations.push(clientOperation);
      }

      const httpOperations = operations.map((o) => this.httpOperation.get(o));
      clientOperationCache.set(client, httpOperations);

      return httpOperations;
    },
    getUrlTemplate(client, _constructor) {
      const constructor = _constructor ? _constructor : this.client.getConstructor(client);
      // By default, we assume that the client has a single templated argument with a single endpoint parameter
      const endpointTemplate: { url: string; parameters: ModelProperty[] } = {
        url: "{endpoint}",
        parameters: [
          this.modelProperty.create({ name: "endpoint", type: $.builtin.string, optional: false }),
        ],
      };

      const servers = this.client.listServers(client);

      // There are no servers defined for this client
      // Give the client a required endpoint parameter
      if (!servers || servers.length === 0) {
        return endpointTemplate;
      }

      for (const server of servers) {
        const serverParams = [...server.parameters.values()].map((p) => p.name).sort();

        let constructorParams = constructor
          ? [...constructor.parameters.properties.values()].map((p) => p.name).sort()
          : [];
        const optionalConstructorParams = constructor?.parameters.properties.get("options");
        if (optionalConstructorParams && this.model.is(optionalConstructorParams.type)) {
          constructorParams = [
            ...constructorParams,
            ...Array.from(optionalConstructorParams.type.properties.values()).map((p) => p.name),
          ];
        }

        // If we don't have any parameters in the server and the constructor says endpoint
        if (
          !serverParams.length &&
          constructorParams.length === 1 &&
          constructorParams[0] === "endpoint"
        ) {
          return {
            url: "{endpoint}",
            parameters: [
              // Add the endpoint parameter as optional since we have a default url
              this.modelProperty.create({
                name: "endpoint",
                type: $.builtin.string,
                optional: true,
                defaultValue: getStringValue(server.url),
              }),
            ],
          };
        }

        // TODO: Handle multiple servers

        return { url: server.url, parameters: Array.from(server.parameters.values()) };
      }

      // Couldn't find a match, return the default
      throw new Error("Couldn't find a matching server for the client");
      return endpointTemplate;
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
    getAuth(client) {
      const [httpService] = getHttpService(this.program, client.service);
      return resolveAuthentication(httpService);
    },
    listServers(client) {
      const currentServers = getServers(this.program, client.service);

      if (currentServers) {
        return currentServers;
      }

      let parent = this.client.getParent(client);

      while (parent) {
        const servers = getServers(this.program, parent.service);
        if (servers) {
          return servers;
        }
        parent = this.client.getParent(parent);
      }

      return undefined;
    },
  },
});
