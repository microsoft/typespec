import { createDiagnosticCreator } from "./diagnostic-creator.js";
import { compilerAssert } from "./diagnostics.js";
import type { Program } from "./program.js";
import { createJSONSchemaValidator } from "./schema-validator.js";
import {
  DiagnosticMessages,
  JSONSchemaValidator,
  LinterDefinition,
  LinterRuleDefinition,
  PackageFlags,
  StateDef,
  TypeSpecLibrary,
  TypeSpecLibraryDef,
} from "./types.js";

export { paramMessage } from "./param-message.js";

const globalLibraryUrlsLoadedSym = Symbol.for("TYPESPEC_LIBRARY_URLS_LOADED");
if ((globalThis as any)[globalLibraryUrlsLoadedSym] === undefined) {
  (globalThis as any)[globalLibraryUrlsLoadedSym] = new Set<string>();
}

const loadedUrls = (globalThis as any)[globalLibraryUrlsLoadedSym];

/**
 * @internal List of urls that used `createTypeSpecLibrary`. Used to keep track of the loaded version of library and make sure they are compatible.
 */
export function getLibraryUrlsLoaded(): Set<string> {
  return loadedUrls;
}

/** @deprecated use createTypeSpecLibrary */
export const createCadlLibrary = createTypeSpecLibrary;

function createStateKeys<T extends string>(
  libName: string,
  state: Record<T, StateDef> | undefined,
): Record<T, symbol> {
  const result: Record<string, symbol> = {};

  for (const key of Object.keys(state ?? {})) {
    result[key] = Symbol.for(`${libName}/${key}`);
  }
  return result as Record<T, symbol>;
}

/**
 * Create a new TypeSpec library definition.
 * @param lib Library definition.
 * @returns Library with utility functions.
 *
 *
 * @tutorial Create the lib object with `as const` to get the full typing.
 *
 * @example
 * const libDef = {
 *   name: "myLib",
 *   diagnostics: {
 *    "my-code": {serverity: "error", messages: {default: "Foo bar"}}
 *   },
 * } as const;
 *
 * const lib = createTypeSpecLibrary(libDef);
 */
export function createTypeSpecLibrary<
  const T extends { [code: string]: DiagnosticMessages },
  const E extends Record<string, any>,
  const State extends string = never,
>(lib: Readonly<TypeSpecLibraryDef<T, E, State>>): TypeSpecLibrary<T, E, State> {
  let emitterOptionValidator: JSONSchemaValidator;

  const { reportDiagnostic, createDiagnostic } = createDiagnosticCreator(lib.diagnostics, lib.name);

  function createStateSymbol(name: string): symbol {
    return Symbol.for(`${lib.name}.${name}`);
  }

  const caller = getCaller();
  if (caller) {
    loadedUrls.add(caller);
  }

  return {
    ...lib,
    diagnostics: lib.diagnostics,
    stateKeys: createStateKeys(lib.name, lib.state),
    reportDiagnostic,
    createDiagnostic,
    createStateSymbol,
    get emitterOptionValidator() {
      if (!emitterOptionValidator && lib.emitter?.options) {
        emitterOptionValidator = createJSONSchemaValidator<E>(lib.emitter.options, {
          coerceTypes: true,
        });
      }
      return emitterOptionValidator;
    },
    getTracer,
  };

  function getTracer(program: Program) {
    return program.tracer.sub(lib.name);
  }
}

export function definePackageFlags(flags: PackageFlags): PackageFlags {
  return flags;
}

export function defineLinter(def: LinterDefinition): LinterDefinition {
  return def;
}

/** Create a new linter rule. */
export function createLinterRule<const N extends string, const T extends DiagnosticMessages>(
  definition: LinterRuleDefinition<N, T>,
) {
  compilerAssert(!definition.name.includes("/"), "Rule name cannot contain a '/'.");
  return definition;
}

/** @deprecated use setTypeSpecNamespace */
export const setCadlNamespace = setTypeSpecNamespace;

/**
 * Set the TypeSpec namespace for that function.
 * @param namespace Namespace string (e.g. "Foo.Bar")
 * @param functions Functions
 */
export function setTypeSpecNamespace(
  namespace: string,
  ...functions: Array<(...args: any[]) => any>
): void {
  functions.forEach((c: any) => (c.namespace = namespace));
}

function getCaller() {
  const caller = getCallStack()[2];
  return typeof caller === "object" && "getFileName" in caller ? caller.getFileName() : undefined;
}

function getCallStack() {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = (new Error() as any).stack.slice(1);
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
}
