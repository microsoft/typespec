import {
  createStateSymbol,
  createTCGCContext,
  getClientNameOverride,
} from "@azure-tools/typespec-client-generator-core";
import { listServices, Namespace } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { Client } from "@typespec/http-client-library";

interface AzureClientLibraryKit {
  /**
   * List all of the clients in a given namespace.
   *
   * @param namespace namespace to get the clients of
   */
  listClients(namespace: Namespace): Client[];
}

interface Typekit {
  clientLibrary: AzureClientLibraryKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ClientLibraryKit extends AzureClientLibraryKit {}
}

defineKit<Typekit>({
  clientLibrary: {
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
  },
});
