// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Namespace, getNamespaceFullName } from "@typespec/compiler";
import {
  DeclarationType,
  JsContext,
  Module,
  ModuleBodyDeclaration,
  createModule,
  isModule,
} from "../ctx.js";
import { parseCase } from "../util/case.js";
import { UnimplementedError } from "../util/error.js";
import { cat, indent, isIterable } from "../util/iter.js";
import { OnceQueue } from "../util/once-queue.js";
import { emitOperationGroup } from "./interface.js";

/**
 * Enqueue all declarations in the namespace to be included in the emit, recursively.
 *
 * @param ctx - The emitter context.
 * @param namespace - The root namespace to begin traversing.
 */
export function visitAllTypes(ctx: JsContext, namespace: Namespace) {
  const { enums, interfaces, models, unions, namespaces, scalars, operations } = namespace;

  for (const type of cat<DeclarationType>(
    enums.values(),
    interfaces.values(),
    models.values(),
    unions.values(),
    scalars.values(),
  )) {
    ctx.typeQueue.add(type);
  }

  for (const ns of namespaces.values()) {
    visitAllTypes(ctx, ns);
  }

  if (operations.size > 0) {
    // If the operation has any floating operations in it, we will synthesize an interface for them in the parent module.
    // This requires some special handling by other parts of the emitter to ensure that the interface for a namespace's
    // own operations is properly imported.
    if (!namespace.namespace) {
      throw new UnimplementedError("no parent namespace in visitAllTypes");
    }

    const parentModule = createOrGetModuleForNamespace(ctx, namespace.namespace);

    parentModule.declarations.push([
      // prettier-ignore
      `/** An interface representing the operations defined in the '${getNamespaceFullName(namespace)}' namespace. */`,
      `export interface ${parseCase(namespace.name).pascalCase}<Context = unknown> {`,
      ...indent(emitOperationGroup(ctx, operations.values(), parentModule)),
      "}",
    ]);
  }
}

/**
 * Create a module for a namespace, or get an existing module if one has already been created.
 *
 * @param ctx - The emitter context.
 * @param namespace - The namespace to create a module for.
 * @returns the module for the namespace.
 */
export function createOrGetModuleForNamespace(
  ctx: JsContext,
  namespace: Namespace,
  root: Module = ctx.globalNamespaceModule,
): Module {
  if (ctx.namespaceModules.has(namespace)) {
    return ctx.namespaceModules.get(namespace)!;
  }

  if (!namespace.namespace) {
    throw new Error("UNREACHABLE: no parent namespace in createOrGetModuleForNamespace");
  }

  const parent =
    namespace.namespace === ctx.globalNamespace
      ? root
      : createOrGetModuleForNamespace(ctx, namespace.namespace);
  const name = namespace.name === "TypeSpec" ? "typespec" : parseCase(namespace.name).kebabCase;

  const module: Module = createModule(name, parent, namespace);

  ctx.namespaceModules.set(namespace, module);

  return module;
}

/**
 * Get a reference to the interface representing the namespace's floating operations.
 *
 * This does not check that such an interface actually exists, so it should only be called in situations where it is
 * known to exist (for example, if an operation comes from the namespace).
 *
 * @param ctx - The emitter context.
 * @param namespace - The namespace to get the interface reference for.
 * @param module - The module the the reference will be written to.
 */
export function emitNamespaceInterfaceReference(
  ctx: JsContext,
  namespace: Namespace,
  module: Module,
): string {
  if (!namespace.namespace) {
    throw new Error("UNREACHABLE: no parent namespace in emitNamespaceInterfaceReference");
  }

  const namespaceName = parseCase(namespace.name).pascalCase;

  module.imports.push({
    binder: [namespaceName],
    from: createOrGetModuleForNamespace(ctx, namespace.namespace),
  });

  return namespaceName;
}

/**
 * Emits a single declaration within a module. If the declaration is a module, it is enqueued for later processing.
 *
 * @param ctx - The emitter context.
 * @param decl - The declaration to emit.
 * @param queue - The queue to add the declaration to if it is a module.
 */
function* emitModuleBodyDeclaration(
  ctx: JsContext,
  decl: ModuleBodyDeclaration,
  queue: OnceQueue<Module>,
): Iterable<string> {
  if (isIterable(decl)) {
    yield* decl;
  } else if (typeof decl === "string") {
    yield* decl.split(/\r?\n/);
  } else {
    if (decl.declarations.length > 0) {
      queue.add(decl);
    }
  }
}

/**
 * Gets a file path from a given module to another module.
 */
function computeRelativeFilePath(from: Module, to: Module): string {
  const fromIsIndex = from.declarations.some((d) => isModule(d));
  const toIsIndex = to.declarations.some((d) => isModule(d));

  const relativePath = (fromIsIndex ? from.cursor : from.cursor.parent!).relativePath(to.cursor);

  if (relativePath.length === 0 && !toIsIndex)
    throw new Error("UNREACHABLE: relativePath returned no fragments");

  if (relativePath.length === 0) return "./index.js";

  const prefix = relativePath[0] === ".." ? "" : "./";

  const suffix = toIsIndex ? "/index.js" : ".js";

  return prefix + relativePath.join("/") + suffix;
}

/**
 * Deduplicates, consolidates, and writes the import statements for a module.
 */
function* writeImportsNormalized(ctx: JsContext, module: Module): Iterable<string> {
  const allTargets = new Set<string>();
  const importMap = new Map<string, Set<string>>();
  const starAsMap = new Map<string, string>();
  const extraStarAs: [string, string][] = [];

  for (const _import of module.imports) {
    // check for same module and continue
    if (_import.from === module) continue;

    const target =
      typeof _import.from === "string"
        ? _import.from
        : computeRelativeFilePath(module, _import.from);

    allTargets.add(target);

    if (typeof _import.binder === "string") {
      if (starAsMap.has(target)) {
        extraStarAs.push([_import.binder, target]);
      } else {
        starAsMap.set(target, _import.binder);
      }
    } else {
      const binders = importMap.get(target) ?? new Set<string>();
      for (const binder of _import.binder) {
        binders.add(binder);
      }
      importMap.set(target, binders);
    }
  }

  for (const target of allTargets) {
    const binders = importMap.get(target);
    const starAs = starAsMap.get(target);

    if (binders && starAs) {
      yield `import ${starAs}, { ${[...binders].join(", ")} } from "${target}";`;
    } else if (binders) {
      yield `import { ${[...binders].join(", ")} } from "${target}";`;
    } else if (starAs) {
      yield `import ${starAs} from "${target}";`;
    }

    yield "";
  }

  for (const [binder, target] of extraStarAs) {
    yield `import ${binder} from "${target}";`;
  }
}

/**
 * Emits the body of a module file.
 *
 * @param ctx - The emitter context.
 * @param module - The module to emit.
 * @param queue - The queue to add any submodules to for later processing.
 */
export function* emitModuleBody(
  ctx: JsContext,
  module: Module,
  queue: OnceQueue<Module>,
): Iterable<string> {
  yield* writeImportsNormalized(ctx, module);

  if (module.imports.length > 0) yield "";

  for (const decl of module.declarations) {
    yield* emitModuleBodyDeclaration(ctx, decl, queue);
    yield "";
  }
}
