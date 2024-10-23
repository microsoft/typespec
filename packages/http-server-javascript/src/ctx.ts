// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  Enum,
  Interface,
  Model,
  Namespace,
  Program,
  Scalar,
  Service,
  Type,
  Union,
  UnionVariant,
  compilerAssert,
  isArrayModelType,
  isRecordModelType,
} from "@typespec/compiler";
import { emitDeclaration } from "./common/declaration.js";
import { createOrGetModuleForNamespace } from "./common/namespace.js";
import { SerializableType } from "./common/serialization/index.js";
import { emitUnion } from "./common/union.js";
import { JsEmitterOptions } from "./lib.js";
import { OnceQueue } from "./util/once-queue.js";

export type DeclarationType = Model | Enum | Union | Interface | Scalar;

/**
 * Determines whether or not a type is importable into a JavaScript module.
 *
 * i.e. whether or not it is declared as a named symbol within the module.
 *
 * In TypeScript, unions are rendered inline, so they are not ordinarily
 * considered importable.
 *
 * @param ctx - The JS emitter context.
 * @param t - the type to test
 * @returns `true` if the type is an importable declaration, `false` otherwise.
 */
export function isImportableType(ctx: JsContext, t: Type): t is DeclarationType {
  return (
    (t.kind === "Model" &&
      !isArrayModelType(ctx.program, t) &&
      !isRecordModelType(ctx.program, t)) ||
    t.kind === "Enum" ||
    t.kind === "Interface"
  );
}

/**
 * Stores stateful information consumed and modified by the JavaScript server
 * emitter.
 */
export interface JsContext {
  /**
   * The TypeSpec Program that this emitter instance operates over.
   */
  program: Program;

  /**
   * The emitter options.
   */
  options: JsEmitterOptions;

  /**
   * The global (root) namespace of the program.
   */
  globalNamespace: Namespace;

  /**
   * The service definition to use for emit.
   */
  service: Service;

  /**
   * A queue of all types to be included in the emit tree. This queue
   * automatically deduplicates types, so if a type is added multiple times it
   * will only be visited once.
   */
  typeQueue: OnceQueue<DeclarationType>;
  /**
   * A list of synthetic types (anonymous types that are given names) that are
   * included in the emit tree.
   */
  synthetics: Synthetic[];
  /**
   * A cache of names given to synthetic types. These names may be used to avoid
   * emitting the same synthetic type multiple times.
   */
  syntheticNames: Map<DeclarationType, string>;

  /**
   * The root module for the emit tree.
   */
  rootModule: Module;

  /**
   * A map relating each namespace to the module that contains its declarations.
   *
   * @see createOrGetModuleForNamespace
   */
  namespaceModules: Map<Namespace, Module>;
  /**
   * The module that contains all synthetic types.
   */
  syntheticModule: Module;
  /**
   * The root module for all named declarations of types referenced by the program.
   */
  modelsModule: Module;
  /**
   * The module within `models` that maps to the global namespace.
   */
  globalNamespaceModule: Module;

  /**
   * A map of all types that require serialization code to the formats they require.
   */
  serializations: OnceQueue<SerializableType>;
}

/**
 * A synthetic type that is not directly represented with a name in the TypeSpec program.
 */
export type Synthetic = AnonymousSynthetic | PartialUnionSynthetic;

/**
 * An ordinary, anonymous type that is given a name.
 */
export interface AnonymousSynthetic {
  kind: "anonymous";
  name: string;
  underlying: DeclarationType;
}

/**
 * A partial union with a name for the given variants.
 */
export interface PartialUnionSynthetic {
  kind: "partialUnion";
  name: string;
  variants: UnionVariant[];
}

/**
 * Adds all pending declarations from the type queue to the module tree.
 *
 * The JavaScript emitter is lazy, and sometimes emitter components may visit
 * types that are not yet declared. This function ensures that all types
 * reachable from existing declarations are complete.
 *
 * @param ctx - The JavaScript emitter context.
 */
export function completePendingDeclarations(ctx: JsContext): void {
  // Add all pending declarations to the module tree.
  while (!ctx.typeQueue.isEmpty() || ctx.synthetics.length > 0) {
    while (!ctx.typeQueue.isEmpty()) {
      const type = ctx.typeQueue.take()!;

      compilerAssert(type.namespace !== undefined, "no namespace for declaration type", type);

      const module = createOrGetModuleForNamespace(ctx, type.namespace);

      module.declarations.push([...emitDeclaration(ctx, type, module)]);
    }

    while (ctx.synthetics.length > 0) {
      const synthetic = ctx.synthetics.shift()!;

      switch (synthetic.kind) {
        case "anonymous": {
          ctx.syntheticModule.declarations.push([
            ...emitDeclaration(ctx, synthetic.underlying, ctx.syntheticModule, synthetic.name),
          ]);
          break;
        }
        case "partialUnion": {
          ctx.syntheticModule.declarations.push([
            ...emitUnion(ctx, synthetic, ctx.syntheticModule, synthetic.name),
          ]);
          break;
        }
      }
    }
  }
}

// #region Module

/**
 * A declaration within a module. This may be a string (i.e. a line), an array of
 * strings (emitted as multiple lines), or another module (emitted as a nested module).
 */
export type ModuleBodyDeclaration = string[] | string | Module;

/**
 * A type-guard that checks whether or not a given value is a module.
 * @returns `true` if the value is a module, `false` otherwise.
 */
export function isModule(value: unknown): value is Module {
  return (
    typeof value === "object" &&
    value !== null &&
    "declarations" in value &&
    Array.isArray(value.declarations)
  );
}

/**
 * Creates a new module with the given name and attaches it to the parent module.
 *
 * Optionally, a namespace may be associated with the module. This namespace is
 * _NOT_ stored in the context (this function does not use the JsContext), and
 * is only stored as metadata within the module. To associate a module with a
 * namespace inside the context, use `createOrGetModuleForNamespace`.
 *
 * The module is automatically declared as a declaration within its parent
 * module.
 *
 * @param name - The name of the module.
 * @param parent - The parent module to attach the new module to.
 * @param namespace - an optional TypeSpec Namespace to associate with the module
 * @returns the newly created module
 */
export function createModule(name: string, parent: Module, namespace?: Namespace): Module {
  const self = {
    name,
    cursor: parent.cursor.enter(name),
    namespace,

    imports: [],
    declarations: [],
  };

  parent.declarations.push(self);

  return self;
}

/**
 * The type of a binding for an import statement. Either:
 *
 * - A string beginning with `* as` followed by the name of the binding, which
 *   imports all exports from the module as a single object.
 * - An array of strings, each of which is a named import from the module.
 */
export type ImportBinder = `* as ${string}` | string[];

/**
 * An object representing a ECMAScript module import declaration.
 */
export interface Import {
  /**
   * The binder to define the import as.
   */
  binder: ImportBinder;
  /**
   * Where to import from. This is either a literal string (which will be used verbatim), or Module object, which will
   * be resolved to a relative file path.
   */
  from: Module | string;
}

/**
 * An output module within the module tree.
 */
export interface Module {
  /**
   * The name of the module, which should be suitable for use as the basename of
   * a file and as an identifier.
   */
  name: string;
  /**
   * The cursor for the module, which assists navigation and relative path
   * computation between modules.
   */
  readonly cursor: PathCursor;

  /**
   * An optional namespace for the module. This is not used by the code writer,
   * but is used to track dependencies between TypeSpec namespaces and create
   * imports between them.
   */
  namespace?: Namespace;

  /**
   * A list of imports that the module requires.
   */
  imports: Import[];

  /**
   * A list of declarations within the module.
   */
  declarations: ModuleBodyDeclaration[];
}

// #endregion

/**
 * A cursor that assists in navigating the module tree and computing relative
 * paths between modules.
 */
export interface PathCursor {
  /**
   * The path to this cursor. This is an array of strings that represents the
   * path from the root module to another module.
   */
  readonly path: string[];

  /**
   * The parent cursor of this cursor (equivalent to moving up one level in the
   * module tree). If this cursor is the root cursor, this property is `undefined`.
   */
  readonly parent: PathCursor | undefined;

  /**
   * Returns a new cursor that includes the given path components appended to
   * this cursor's path.
   *
   * @param path - the path to append to this cursor
   */
  enter(...path: string[]): PathCursor;

  /**
   * Computes a relative path from this cursor to another cursor, using the string `up`
   * to navigate upwards one level in the path. This is similar to `path.relative` when
   * working with file paths, but operates over PathCursor objects.
   *
   * @param to - the cursor to compute the path to
   * @param up - the string to use to move up a level in the path (defaults to "..")
   */
  relativePath(to: PathCursor, up?: string): string[];
}

/**
 * Create a new cursor with the given path.
 *
 * @param base - the base path of this cursor
 * @returns
 */
export function createPathCursor(...base: string[]): PathCursor {
  const self: PathCursor = {
    path: base,

    get parent() {
      return self.path.length === 0 ? undefined : createPathCursor(...self.path.slice(0, -1));
    },

    enter(...path: string[]) {
      return createPathCursor(...self.path, ...path);
    },

    relativePath(to: PathCursor, up: string = ".."): string[] {
      const commonPrefix = getCommonPrefix(self.path, to.path);

      const outputPath = [];

      for (let i = 0; i < self.path.length - commonPrefix.length; i++) {
        outputPath.push(up);
      }

      outputPath.push(...to.path.slice(commonPrefix.length));

      return outputPath;
    },
  };

  return self;
}

/**
 * Compute the common prefix of two paths.
 */
function getCommonPrefix(a: string[], b: string[]): string[] {
  const prefix = [];

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      break;
    }

    prefix.push(a[i]);
  }

  return prefix;
}
