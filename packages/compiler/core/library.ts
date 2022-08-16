import { fileURLToPath } from "url";
import { createDiagnosticCreator } from "./diagnostics.js";
import { CadlLibrary, CadlLibraryDef, CallableMessage, DiagnosticMessages } from "./types.js";

(global as any)._CADL_LIBRARY_LOADED_ = new Set<string>();

export const LIBRARIES_LOADED = (global as any)._CADL_LIBRARY_LOADED_;

/**
 * Create a new Cadl library definition.
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
 * const lib = createCadlLibrary(libDef);
 */
export function createCadlLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any>
>(lib: Readonly<CadlLibraryDef<T, E>>): CadlLibrary<T, E> {
  const { reportDiagnostic, createDiagnostic } = createDiagnosticCreator(lib.diagnostics, lib.name);
  function createStateSymbol(name: string): symbol {
    return Symbol.for(`${lib.name}.${name}`);
  }

  const caller = getCaller();
  LIBRARIES_LOADED.add(fileURLToPath(caller));
  return { ...lib, reportDiagnostic, createDiagnostic, createStateSymbol };
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

/**
 * Set the Cadl namespace for that function.
 * @param namespace Namespace string (e.g. "Foo.Bar")
 * @param functions Functions
 */
export function setCadlNamespace(
  namespace: string,
  ...functions: Array<(...args: any[]) => any>
): void {
  functions.forEach((c: any) => (c.namespace = namespace));
}

function getCaller() {
  return getCallStack()[2].getFileName();
}

function getCallStack() {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = (new Error() as any).stack.slice(1); // eslint-disable-line unicorn/error-message
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
}
