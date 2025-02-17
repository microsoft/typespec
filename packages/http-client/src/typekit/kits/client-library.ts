import {
  Enum,
  getLocationContext,
  Interface,
  listServices,
  Model,
  Namespace,
  navigateType,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/experimental/typekit";
import { HttpOperation, isHttpFile } from "@typespec/http";
import { InternalClient } from "../../interfaces.js";

/**
 * ClientLibraryKit provides a set of utilities to work with the client library.
 */
export interface ClientLibraryKit {
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
  listClients(type: Namespace | InternalClient): InternalClient[];

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
  listDataTypes(namespace: InternalClient): Array<Model | Enum | Union>;
}

interface TypekitExtension {
  clientLibrary: ClientLibraryKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  clientLibrary: {
    listNamespaces(namespace) {
      if (namespace) {
        return [...namespace.namespaces.values()].filter((ns) => this.type.isUserDefined(ns));
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
    listDataTypes(client: InternalClient) {
      return collectTypes(client, { includeTemplateDeclaration: false }).dataTypes;
    },
  },
});

export interface TypeCollectorOptions {
  includeTemplateDeclaration?: boolean;
  includeTypeSpecTypes?: boolean;
}

export function collectTypes(client: InternalClient, options: TypeCollectorOptions = {}) {
  const dataTypes = new Set<Model | Enum | Union>();
  const operations: HttpOperation[] = [];
  $.client.flat(client).forEach((c) => {
    const ops = $.client.listHttpOperations(c);
    operations.push(...ops);

    const params = $.client.getConstructor(c).parameters;
    collectDataType(params, dataTypes, options);
  });

  for (const operation of operations) {
    collectDataType(operation.operation, dataTypes, options);
  }

  return {
    dataTypes: [...dataTypes],
    operations: [...operations],
  };
}

function collectDataType(type: Type, dataTypes: Set<DataType>, options: TypeCollectorOptions = {}) {
  navigateType(
    type,
    {
      model(m) {
        trackType(dataTypes, m);
        m.derivedModels
          .filter((dm) => !dataTypes.has(dm))
          .forEach((dm) => collectDataType(dm, dataTypes, options));
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
        trackType(dataTypes, u);
      },
      unionVariant(v) {
        trackType(dataTypes, v.type);
      },
    },
    { includeTemplateDeclaration: options.includeTemplateDeclaration },
  );
}

type DataType = Model | Union | Enum | Scalar;

function isDataType(type: Type): type is DataType {
  return (
    type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar"
  );
}

function isDeclaredType(type: Type): boolean {
  if (isHttpFile($.program, type)) {
    return true;
  }

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
  if ($.httpPart.is(type)) {
    collectDataType($.httpPart.unpack(type), types);
    return;
  }

  if (!isDataType(type)) {
    return;
  }

  if (!isDeclaredType(type)) {
    return;
  }

  types.add(type);
}
