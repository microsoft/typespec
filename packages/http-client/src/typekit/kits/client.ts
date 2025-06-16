import { ignoreDiagnostics, Interface, Namespace, Service } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import "@typespec/http/experimental/typekit";
import { resolveClientInitialization } from "../../client-initialization-resolution.js";
import {
  getClientFromContainer,
  resolveClients,
  ResolveClientsOptions,
} from "../../client-resolution.js";
import { Client, ClientInitialization } from "../../interfaces.js";
import { getService } from "../../utils/client-server-helpers.js";

interface ClientKit {
  /**
   * Gets the client associated with a namespace or interface.
   * @param container The namespace or interface to get the client for.
   * @returns The client associated with the namespace or interface, or undefined if no client is found.
   */
  get(container: Namespace | Interface): Client | undefined;
  /**
   * Lists all clients in the program.
   */
  list(options?: ResolveClientsOptions): Client[];
  /**
   * Gets the parameters needed for initializing a client.
   * @param client The client to get the initialization parameters for.
   */
  getInitialization(client: Client): ClientInitialization | undefined;
  /**
   * Gets the service associated with a client.
   * @param client The client to get the service for.
   * @returns The service associated with the client, or undefined if not found.
   */
  getService(client: Client): Service | undefined;
}

interface TypekitExtension {
  client: ClientKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  client: {
    get(container: Namespace | Interface): Client | undefined {
      return getClientFromContainer(this.program, container);
    },
    getService(client: Client): Service | undefined {
      return getService(this.program, client);
    },
    list(options) {
      return ignoreDiagnostics(resolveClients(this.program, options));
    },

    getInitialization(client: Client): ClientInitialization | undefined {
      return ignoreDiagnostics(resolveClientInitialization(this.program, client));
    },
  },
});
