import {
  getService,
  Interface,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  Model,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { Client } from "../../interfaces.js";
import { addCredentialParameter, addEndpointParameter } from "../../utils/client-initialization.js";
import { NameKit } from "./utils.js";

interface ClientKit extends NameKit<Namespace> {
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
  client: ClientKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypekitPrototype extends TypeKit {}
}

defineKit<TypeKit>({
  client: {
    getName(client) {
      const name = client.name;
      return name.endsWith("Client") ? name : `${name}Client`;
    },
    getInitializationModel(client) {
      const base = $.model.create({
        name: "ClientInitializationOptions",
        properties: {},
      });
      addEndpointParameter(client, base);
      addCredentialParameter(client, base);
      return base;
    },
    listServiceOperations(client) {
      const operations: Operation[] = [];

      function addOperations(current: Namespace | Interface) {
        if (
          current.kind === "Namespace" &&
          current !== client.type &&
          getService($.program, current)
        ) {
          // if I'm a different service, I'm done
          return;
        }
        if (current.kind === "Interface" && isTemplateDeclaration(current)) {
          // Skip template interface operations
          return;
        }

        for (const op of current.operations.values()) {
          // Skip templated operations
          if (!isTemplateDeclarationOrInstance(op)) {
            operations.push(op);
          }
        }

        if (current.kind === "Namespace") {
          for (const subItem of current.namespaces.values()) {
            addOperations(subItem);
          }
          for (const subItem of current.interfaces.values()) {
            addOperations(subItem);
          }
        }
      }

      addOperations(client.type);
      return operations;
    },
  },
});
