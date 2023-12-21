import { createDiagnosticCreator } from "./diagnostic-creator.js";
import { compilerAssert } from "./diagnostics.js";
import { Program } from "./program.js";
import { createJSONSchemaValidator } from "./schema-validator.js";
import {
  CallableMessage,
  DiagnosticMessages,
  JSONSchemaValidator,
  LinterRuleDefinition,
  TypeSpecLibrary,
  TypeSpecLibraryDef,
} from "./types.js";

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
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any>,
>(lib: Readonly<TypeSpecLibraryDef<T, E>>): TypeSpecLibrary<T, E> {
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

export function paramMessage<T extends string[]>(
  strings: readonly string[],
  ...keys: T
): CallableMessage<T> {
  const template = (dict: Record<T[number], string>) => {
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = (dict as any)[key];
      if (value !== undefined) {
        result.push(value);
      }
      result.push(strings[i + 1]);
    });
    return result.join("");
  };
  template.keys = keys;
  return template;
}

/** Create a new linter rule. */
export function createLinterRule<const N extends string, const T extends DiagnosticMessages>(
  definition: LinterRuleDefinition<N, T>
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
  const stack = (new Error() as any).stack.slice(1); // eslint-disable-line unicorn/error-message
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
}
