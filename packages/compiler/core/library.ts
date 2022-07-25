import { createDiagnosticCreator } from "./diagnostics.js";
import { CadlLibrary, CadlLibraryDef, CallableMessage, DiagnosticMessages } from "./types.js";

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
  return { ...lib, reportDiagnostic, createDiagnostic };
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
