import { isArrayModelType, type Namespace, type Program, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";

/**
 * A self-contained type world — a namespace containing only the mutated types
 * for a given stage or schema. Enables `navigateTypesInNamespace` to walk
 * the mutated graph, and serves as the inter-stage / inter-emitter contract.
 *
 * @see https://github.com/microsoft/typespec/pull/10693#discussion_r3243305988
 *   Timothee Guerin's exploration of TypeGraph at the compiler level.
 */
export interface TypeGraph {
  readonly globalNamespace: Namespace;
}

export interface BuildTypeGraphOptions {
  /**
   * Filter for transitively-discovered types. Return false to exclude a type
   * from the graph. Root types (passed directly) are always included.
   * Used by renderers to exclude built-in types they handle implicitly.
   */
  shouldIncludeRef?: (type: Type) => boolean;
}

/**
 * Package a set of types into a self-contained TypeGraph.
 * Adds the given root types and transitively discovers all types they
 * reference (through properties, return types, parameters), producing
 * a self-contained graph the renderer can resolve without external lookups.
 */
export function buildTypeGraph(
  program: Program,
  tk: Typekit,
  types: Type[],
  options?: BuildTypeGraphOptions,
): TypeGraph {
  const globalNamespace = tk.type.clone(program.getGlobalNamespaceType());
  tk.type.finishType(globalNamespace);

  globalNamespace.models = new Map();
  globalNamespace.operations = new Map();
  globalNamespace.enums = new Map();
  globalNamespace.unions = new Map();
  globalNamespace.scalars = new Map();
  globalNamespace.interfaces = new Map();
  globalNamespace.namespaces = new Map();

  const registered = new Set<Type>();
  const shouldIncludeRef = options?.shouldIncludeRef ?? (() => true);

  for (const type of types) {
    register(globalNamespace, registered, type);
  }

  return { globalNamespace };

  function register(ns: Namespace, registered: Set<Type>, type: Type): void {
    if (registered.has(type)) return;
    registered.add(type);
    type.isFinished = true;

    switch (type.kind) {
      case "Model":
        if (isArrayModelType(type)) return;
        type.namespace = ns;
        ns.models.set(type.name, type);
        for (const prop of type.properties.values()) {
          registerRef(ns, registered, prop.type);
        }
        break;
      case "Operation":
        type.namespace = ns;
        ns.operations.set(type.name, type);
        registerRef(ns, registered, type.returnType);
        for (const param of type.parameters.properties.values()) {
          registerRef(ns, registered, param.type);
        }
        break;
      case "Enum":
        type.namespace = ns;
        ns.enums.set(type.name, type);
        break;
      case "Union":
        if (!type.name) return;
        type.namespace = ns;
        ns.unions.set(type.name, type);
        break;
      case "Scalar":
        type.namespace = ns;
        ns.scalars.set(type.name, type);
        break;
      case "Interface":
        type.namespace = ns;
        ns.interfaces.set(type.name, type);
        break;
    }
  }

  function registerRef(ns: Namespace, registered: Set<Type>, type: Type): void {
    if (type.kind === "Model" && isArrayModelType(type) && type.indexer?.value) {
      registerRef(ns, registered, type.indexer.value);
    } else if (shouldIncludeRef(type)) {
      register(ns, registered, type);
    }
  }
}
