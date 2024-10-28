import {
  createStateSymbol,
  createTCGCContext,
  getClientInitialization as tcgcGetClientInitialization,
  getClientNameOverride,
  SdkClient,
} from "@azure-tools/typespec-client-generator-core";
import { Enum, Interface, listServices, Model, Namespace, Operation } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";

export interface Client {
  kind: "Client";
  name: string;
  type: Namespace | Interface;
  service: Namespace;
}

interface ClientKit {
  client: {
    /**
     * Return the model that should be used to initialize the client.
     *
     * @param client the client to get the initialization model for
     */
    getInitializationModel(client: Client): Model;

    /**
     * Return the methods on the client
     *
     * @param client the client to get the methods for
     */
    listServiceOperations(client: Client): Operation[];

    /**
     * List getters for subclients
     *
     * @param client the client to get the subclients for
     */
    listSubClientAccessors(client: Client): SdkClient[];
  };
}

declare module "@typespec/compiler/typekit" {
  interface TypekitPrototype extends ClientKit {}
}

defineKit<ClientKit>({
  client: {
    getInitializationModel(client) {
      const context = createTCGCContext($.program, "typescript");
      // TODO: expose a way to get the client initialization model without tcgc type conversion
      const base =
        [...context.program.stateMap(createStateSymbol("clientInitialization")).values()][0] ||
        $.model.create({
          name: "ClientInitializationOptions",
          properties: {},
        });
      addEndpointParameter(client, base);
      // addCredentialParameter(client, base);
      return base;
    },
    listServiceOperations(client) {
      return [];
    },
    listSubClientAccessors(client) {
      return [];
    },
  },
});

function addEndpointParameter(client: Client, base: Model): undefined {
  const servers = getServers($.program, client.service);
  if (servers === undefined) {
    const name = "endpoint";
    base.properties.set(
      name,
      $.modelProperty.create({
        name,
        type: $.program.checker.getStdType("string"),
        optional: false,
      }),
    );
  } else {
    for (const server of servers) {
    }
  }
}
