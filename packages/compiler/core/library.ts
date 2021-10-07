import { createDiagnostic } from "./diagnostics.js";
import { Program } from "./program.js";
import {
  CadlLibrary,
  CadlLibraryDef,
  CallableMessage,
  DiagnosticMessages,
  DiagnosticReport,
} from "./types.js";

/**
 * Create a new CADL library definition.
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
export function createCadlLibrary<T extends { [code: string]: DiagnosticMessages }>(
  lib: Readonly<CadlLibraryDef<T>>
): CadlLibrary<T> {
  function reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diagnostic: DiagnosticReport<T, C, M>
  ) {
    const diagnosticDef = lib.diagnostics[diagnostic.code];

    if (!diagnosticDef) {
      const codeStr = Object.keys(lib.diagnostics)
        .map((x) => ` - ${x}`)
        .join("\n");
      throw new Error(
        `Unexpected diagnostic code '${diagnostic.code}'. It must match one of the code defined in the library '${lib.name}'. Defined codes:\n${codeStr}`
      );
    }

    const message = diagnosticDef.messages[diagnostic.messageId ?? "default"];
    if (!message) {
      const codeStr = Object.keys(diagnosticDef.messages)
        .map((x) => ` - ${x}`)
        .join("\n");
      throw new Error(
        `Unexpected message id '${diagnostic.messageId}'. It must match one of the code defined in the library '${lib.name}' for code '${diagnostic.code}'. Defined codes:\n${codeStr}`
      );
    }

    const messageStr = typeof message === "string" ? message : message((diagnostic as any).format);

    program.reportDiagnostic(
      createDiagnostic({
        code: `${lib.name}/${diagnostic.code}`,
        severity: diagnosticDef.severity,
        message: messageStr,
        target: diagnostic.target,
      })
    );

    program.reportDiagnostic;
  }
  return { ...lib, reportDiagnostic };
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
