import type { Enum, Interface, Model, Namespace, Scalar, Type, Union } from "@typespec/compiler";
import { getLocationContext, listServices, navigateType } from "@typespec/compiler";
import { defineKit, type Typekit } from "@typespec/compiler/typekit";
import type { HttpOperation } from "@typespec/http";
import { isHttpFile } from "@typespec/http";
import type { InternalClient } from "../../interfaces.js";

/**
 * Discovers namespaces, clients, and data types for client generation through `$.clientLibrary`.
 * Import `@typespec/http-client/typekit` to register these extensions on the compiler typekit.
 */
export interface ClientLibraryKit {
  /**
   * Lists project namespaces directly under the global namespace when no argument is supplied.
   * With a namespace argument, lists its immediate user-defined child namespaces.
   */
  listNamespaces(namespace?: Namespace): Namespace[];

  /**
   * Lists client descriptors for a namespace or an existing client.
   * A service namespace returns its own client. An existing namespace-backed client returns child
   * namespace and interface clients; passing a non-service namespace also includes that namespace's
   * own client. Interface-backed clients have no children.
   */
  listClients(type: Namespace | InternalClient): InternalClient[];

  /**
   * Lists models declared in the namespace that are found in its operations' parameters.
   * Also includes directly nested model-property types and spread source models from that namespace;
   * this is not a recursive traversal of every reachable model or of response types.
   */
  listModels(namespace: Namespace): Model[];

  /**
   * Lists enums declared directly in the namespace, preserving declaration order.
   */
  listEnums(namespace: Namespace): Enum[];
  /**
   * Collects named data types reachable from this client's constructors and operations, including
   * those of descendant clients. Template declarations are excluded and results are deduplicated.
   */
  listDataTypes(namespace: InternalClient): Array<Model | Enum | Union>;
}

interface TypekitExtension {
  /** Client-library discovery utilities, registered by importing `@typespec/http-client/typekit`. */
  clientLibrary: ClientLibraryKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  clientLibrary: {
    listNamespaces(namespace) {
      if (namespace) {
        return [...namespace.namespaces.values()].filter((ns) => this.type.isUserDefined(ns));
      }
      return [...this.program.getGlobalNamespaceType().namespaces.values()].filter(
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
      return collectTypes(this, client, { includeTemplateDeclaration: false }).dataTypes;
    },
  },
});

/** Controls traversal when collecting a client's operation and constructor data types. */
export interface TypeCollectorOptions {
  /** Whether semantic traversal visits template declarations; defaults to false. */
  includeTemplateDeclaration?: boolean;
  /** Reserved option; currently has no effect on collection or filtering of TypeSpec built-ins. */
  includeTypeSpecTypes?: boolean;
}

/**
 * Traverses a client and its descendants to collect HTTP operations and named data types.
 * Types are discovered through constructors, operation signatures, and derived models; multipart
 * wrappers are unpacked. Anonymous types and types in the `TypeSpec` namespace are not added,
 * except for HTTP file types.
 *
 * @returns Data types deduplicated by identity and HTTP operations in client traversal order.
 */
export function collectTypes(
  $: Typekit,
  client: InternalClient,
  options: TypeCollectorOptions = {},
) {
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

  function collectDataType(
    type: Type,
    dataTypes: Set<DataType>,
    options: TypeCollectorOptions = {},
  ) {
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
      type.kind === "Model" ||
      type.kind === "Union" ||
      type.kind === "Enum" ||
      type.kind === "Scalar"
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
}
