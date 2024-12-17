import {
  Enum,
  getLocationContext,
  Interface,
  listServices,
  Model,
  Namespace,
  navigateType,
  Operation,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { Client } from "../../interfaces.js";

interface ClientLibraryKit {
  /**
   * Get the top-level namespaces that are used to generate the client library.
   *
   * @param namespace: If namespace param is given, we will return the children of the given namespace.
   *
   */
  listNamespaces(namespace?: Namespace): Namespace[];

  /**
   * List all of the clients in a given namespace.
   *
   * @param namespace namespace to get the clients of
   */
  listClients(type: Namespace | Client): Client[];

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
  listDataTypes(namespace: Client): Type[];
}

interface TK {
  clientLibrary: ClientLibraryKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Typekit extends TK {}
}

defineKit<TK>({
  clientLibrary: {
    listNamespaces(namespace) {
      if (namespace) {
        return [...namespace.namespaces.values()];
      }
      return [...this.program.checker.getGlobalNamespaceType().namespaces.values()].filter(
        (n) => getLocationContext(this.program, n).type === "project",
      );
    },
    listClients(type) {
      if (type.kind === "Namespace") {
        const topLevelNamespaces = listServices(this.program)
          .filter((i) => i.type === type)
          .map((sn) => {
            return this.client.getClient(sn.type);
          });
        if (topLevelNamespaces.length !== 0) {
          // if we're trying to get top-level namespaces, we should return them
          return topLevelNamespaces;
        }
      }
      const clientType = type.kind === "Client" ? type.type : type;
      const clientIsNamespace = clientType.kind === "Namespace";
      if (!clientIsNamespace) {
        return [];
      }
      const subnamespaces: (Namespace | Interface)[] = [
        ...this.clientLibrary.listNamespaces(clientType),
        ...clientType.interfaces.values(),
      ];
      if (type.kind === "Namespace") {
        // this means we're trying to get the clients of a subnamespace, so we have to include the subnamespace itself
        subnamespaces.push(clientType);
      }
      return subnamespaces.map((sn) => {
        return this.client.getClient(sn);
      });
    },
    listModels(namespace) {
      const allModels = [...namespace.models.values()];
      const modelsMap: Map<string, Model> = new Map();
      for (const op of namespace.operations.values()) {
        for (const param of op.parameters.properties.values()) {
          if (param.type.kind === "Model" && allModels.includes(param.type)) {
            modelsMap.set(param.type.name, param.type);
            for (const prop of param.type.properties.values()) {
              if (
                prop.type.kind === "Model" &&
                allModels.includes(prop.type) &&
                !modelsMap.has(prop.type.name)
              ) {
                modelsMap.set(prop.type.name, prop.type);
              }
            }
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
    listDataTypes(client: Client) {
      return collectTypes(client, { includeTemplateDeclaration: false }).dataTypes;
    },
  },
});

export interface TypeCollectorOptions {
  includeTemplateDeclaration?: boolean;
  includeTypeSpecTypes?: boolean;
}

export function collectTypes(client: Client, options: TypeCollectorOptions = {}) {
  const dataTypes = new Set<Model | Enum | Union>();
  const operations: Operation[] = [];
  $.client.flat(client).forEach((c) => {
    const ops = $.client.listServiceOperations(c);
    operations.push(...ops);
  });

  for (const operation of operations) {
    navigateType(
      operation,
      {
        model(m) {
          trackType(dataTypes, m);
        },
        modelProperty(p) {
          trackType(dataTypes, p.type);
        },
        scalar(s) {
          if (s.namespace?.name !== "TypeSpec") {
            return;
          }

          trackType(dataTypes, s);
        },
        enum(e) {
          trackType(dataTypes, e);
        },
        union(u) {
          u.variants;
          trackType(dataTypes, u);
        },
        unionVariant(v) {
          trackType(dataTypes, v.type);
        },
      },
      { includeTemplateDeclaration: options.includeTemplateDeclaration },
    );
  }

  return {
    dataTypes: [...dataTypes],
    operations: [...operations],
  };
}

type DataType = Model | Union | Enum | Scalar;

function isDataType(type: Type): type is DataType {
  return (
    type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar"
  );
}

function isDeclaredType(type: Type): boolean {
  if ("namespace" in type && type.namespace?.name === "TypeSpec") {
    return false;
  }

  if (!isDataType(type)) {
    return false;
  }

  if (type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Set<DataType>, type: Type) {
  if (!isDataType(type)) {
    return;
  }

  if (!isDeclaredType(type)) {
    return;
  }

  types.add(type);
}