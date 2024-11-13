import {
  createStateSymbol,
  createTCGCContext,
  SdkClient,
} from "@azure-tools/typespec-client-generator-core";
import { Model } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { addEndpointParameter, Client } from "@typespec/http-client-library";

interface SdkClientKit {
  /**
   * Return the model that should be used to initialize the client.
   *
   * @param client the client to get the initialization model for
   */
  getInitializationModel(client: Client): Model;

  /**
   * List getters for subclients
   *
   * @param client the client to get the subclients for
   */
  listSubClientAccessors(client: Client): SdkClient[];
}

interface TypeKit {
  client: SdkClientKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ClientKit extends SdkClientKit {}
}

defineKit<TypeKit>({
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
      // getCredentalParameter(client, base);
      return base;
    },
    listSubClientAccessors(client) {
      // TODO: Remove, added to avoid eslint error
      console.log(client.name);
      return [];
    },
  },
});
