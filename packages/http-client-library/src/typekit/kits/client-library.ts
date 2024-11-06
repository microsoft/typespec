import {
  Enum,
  getLocationContext,
  Interface,
  listServices,
  Model,
  Namespace,
} from "@typespec/compiler";
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
  listClients(namespace: Namespace | Interface): Client[];

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
      return [...$.program.checker.getGlobalNamespaceType().namespaces.values()].filter(
        (n) => getLocationContext($.program, n).type === "project",
      );
    },
    listSubNamespaces(namespace) {
      return [...namespace.namespaces.values()];
    },
    listClients(namespace) {
      // if there is no explicit client, we will treat namespaces with service decorator as clients
      if (namespace.kind === "Interface") {
        return [];
      }
      const services = listServices(this.program);
      const clients: Client[] = services
        .filter((x) => x.type === namespace)
        .map((service) => {
          let name = service.type.name;
          name = name.endsWith("Client") ? name : `${name}Client`;
          return {
            kind: "Client",
            name,
            service: service.type,
            type: service.type,
          };
        });

      return clients;
    },
    listModels(namespace) {
      const allModels = [...namespace.models.values()];
      const modelsMap: Map<string, Model> = new Map();
      for (const op of namespace.operations.values()) {
        for (const param of op.parameters.properties.values()) {
          if (param.type.kind === "Model" && allModels.includes(param.type)) {
            modelsMap.set(param.type.name, param.type);
          }
          if (
            param.sourceProperty?.type.kind === "Model" &&
            allModels.includes(param.sourceProperty?.type)
          ) {
            modelsMap.set(param.sourceProperty?.type.name, param.sourceProperty?.type);
          }
        }
      }
      return [...modelsMap.values()];
    },
    listEnums(namespace) {
      return [...namespace.enums.values()];
    },
  },
});
