import {  Model, Namespace, Operation } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { addEndpointParameter } from "../../utils/client-initialization.js";
import { Client } from "../../interfaces.js";


interface OperationKit {

    getAccess(operation: Operation): void;
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
}

interface TypeKit {
  client: OperationKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypekitPrototype extends TypeKit {}
}

defineKit<TypeKit>({
  client: {
    getName(client) {
      const operation: Operation;
      const name = client.name;
      return name.endsWith("Client")
          ? name
          : `${name}Client`;
    },
    getInitializationModel(client) {
      const base =
        $.model.create({
          name: "ClientInitializationOptions",
          properties: {},
        });
      addEndpointParameter(client, base);
      addCredentialParameter(client, base);
      return base;
    },
    listServiceOperations(client) {
      // TODO: Remove, added to avoid eslint error
      console.log(client.name);
      return [];
    },
  },
});
