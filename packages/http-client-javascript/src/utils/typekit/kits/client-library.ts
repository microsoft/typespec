import {
  createStateSymbol,
  createTCGCContext,
  getClientNameOverride,
  SdkClient,
} from "@azure-tools/typespec-client-generator-core";
import { Enum, Interface, listServices, Model, Namespace } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";

export interface Client {
  kind: "Client";
  name: string;
  type: Namespace | Interface;
  service: Namespace;
}

interface ClientLibraryKit {
  clientLibrary: {
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
    listClients(namespace: Namespace): SdkClient[];

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
  };
}

declare module "@typespec/compiler/typekit" {
  interface TypekitPrototype extends ClientLibraryKit {}
}

defineKit<ClientLibraryKit>({
  clientLibrary: {
    listNamespaces() {
      return [...$.program.checker.getGlobalNamespaceType().namespaces.values()];
    },
    listSubNamespaces(namespace) {
      return [...namespace.namespaces.values()];
    },
    listClients(namespace) {
      const context = createTCGCContext($.program, "python");
      const explicitClients = [...context.program.stateMap(createStateSymbol("client")).values()];
      if (explicitClients.length > 0) {
        return explicitClients.filter((x) => x.type.namespace === namespace);
      }
      // if there is no explicit client, we will treat namespaces with service decorator as clients
      const services = listServices(context.program);

      const clients: Client[] = services
        .filter((x) => x.type === namespace)
        .map((service) => {
          let originalName = service.type.name;
          const clientNameOverride = getClientNameOverride(context, service.type);
          if (clientNameOverride) {
            originalName = clientNameOverride;
          }
          const clientName = originalName.endsWith("Client")
            ? originalName
            : `${originalName}Client`;
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
