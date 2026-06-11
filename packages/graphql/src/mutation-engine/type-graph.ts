import type { Namespace, Program, Type } from "@typespec/compiler";
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

/**
 * Package a set of types into a self-contained TypeGraph.
 * Sets `.namespace` on each type so that `navigateTypesInNamespace` will visit them.
 */
export function buildTypeGraph(program: Program, tk: Typekit, types: Type[]): TypeGraph {
  const globalNamespace = tk.type.clone(program.getGlobalNamespaceType());
  tk.type.finishType(globalNamespace);

  globalNamespace.models = new Map();
  globalNamespace.operations = new Map();
  globalNamespace.enums = new Map();
  globalNamespace.unions = new Map();
  globalNamespace.scalars = new Map();
  globalNamespace.interfaces = new Map();
  globalNamespace.namespaces = new Map();

  for (const type of types) {
    addToNamespace(tk, globalNamespace, type);
  }

  return { globalNamespace };
}

function addToNamespace(tk: Typekit, ns: Namespace, type: Type): void {
  if (!type.isFinished) {
    tk.type.finishType(type);
  }

  switch (type.kind) {
    case "Model":
      type.namespace = ns;
      ns.models.set(type.name, type);
      break;
    case "Operation":
      type.namespace = ns;
      ns.operations.set(type.name, type);
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
