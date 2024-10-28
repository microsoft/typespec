import {
  createStateSymbol,
  createTCGCContext,
  getClientInitialization as tcgcGetClientInitialization,
  getClientNameOverride,
  SdkClient,
} from "@azure-tools/typespec-client-generator-core";
import { Enum, Interface, listServices, Model, Namespace, Operation } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";

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
      // const context = createTCGCContext($.program, "typescript");
      // const base = tcgcGetClientInitialization(context, client.type) || $.model.create(
      //   {
      //     name: "ClientInitialization",
      //     properties: {}
      //   }
      // );\
      return $.model.create({properties: {}})
    },
    listServiceOperations(client) {
      return [];
    },
    listSubClientAccessors(client) {
      return [];
    },
  },
});
