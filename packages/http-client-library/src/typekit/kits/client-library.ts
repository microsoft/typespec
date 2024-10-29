import { Enum, listServices, Model, Namespace } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { Client } from "../../interfaces.js";

interface ClientLibraryKit {
    /**
     * Get the top-level namespaces that are used to generate the client library.
     *
     */
    listNamespaces(): Namespace[];

    /**
     * Get the namespaces below a given namespace that are used to generate the client library.
     
     * @param namespace namespace to get the children of
     */
    listSubNamespaces(namespace: Namespace): Namespace[];

    /**
     * List all of the clients in a given namespace.
     *
     * @param namespace namespace to get the clients of
     */
    listClients(namespace: Namespace): Client[];

    /**
     * List all of the models in a given namespace.
     *
     * @param namespace namespace to get the models of
     */
    listModels(namespace: Namespace): Model[];

    /**
     * List all of the enums in a given namespace.
     *
     * @param namespace namespace to get the enums of
     */
    listEnums(namespace: Namespace): Enum[];
}

interface Typekit {
  clientLibrary: ClientLibraryKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypekitPrototype extends Typekit {}
}

defineKit<Typekit>({
  clientLibrary: {
    listNamespaces() {
      return [...$.program.checker.getGlobalNamespaceType().namespaces.values()];
    },
    listSubNamespaces(namespace) {
      return [...namespace.namespaces.values()];
    },
    listClients(namespace) {
      // if there is no explicit client, we will treat namespaces with service decorator as clients
      const services = listServices(this.program);
      const clients: Client[] = services
      .filter((x) => x.type === namespace)
      .map((service) => {
        const clientName = this.client.getName(service.type);
        return {
          kind: "Client",
          name: clientName,
          service: service.type,
          type: service.type,
        };
      });

      return clients;
    },
    listModels(namespace) {
      return [...namespace.models.values()];
    },
    listEnums(namespace) {
      return [...namespace.enums.values()];
    },
  },
});
