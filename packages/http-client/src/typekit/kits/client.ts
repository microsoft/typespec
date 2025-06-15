import { ignoreDiagnostics, Interface, Namespace } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import "@typespec/http/experimental/typekit";
import { resolveClientInitialization } from "../../client-initialization-resolution.js";
import { getClientFromContainer, resolveClients } from "../../client-resolution.js";
import { Client, ClientInitialization } from "../../interfaces.js";

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
  list(): Client[];
  /**
   * Gets the parameters needed for initializing a client.
   * @param client The client to get the initialization parameters for.
   */
  getInitialization(client: Client): ClientInitialization | undefined;
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
    list() {
      return ignoreDiagnostics(resolveClients(this.program));
    },

    getInitialization(client: Client): ClientInitialization | undefined {
      return ignoreDiagnostics(resolveClientInitialization(this.program, client));
    },
  },
});
