import type { Program } from "./program.js";
import type {
  Diagnostic,
  DiagnosticCreator,
  DiagnosticMap,
  DiagnosticMessages,
  DiagnosticReport,
} from "./types.js";

/**
 * Create a new diagnostics creator.
 * @param diagnostics Map of the potential diagnostics.
 * @param libraryName Optional name of the library if in the scope of a library.
 * @returns @see DiagnosticCreator
 */
export function createDiagnosticCreator<T extends { [code: string]: DiagnosticMessages }>(
  diagnostics: DiagnosticMap<T>,
  libraryName?: string,
): DiagnosticCreator<T> {
  const errorMessage = libraryName
    ? `It must match one of the code defined in the library '${libraryName}'`
    : "It must match one of the code defined in the compiler.";

  function createDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    diagnostic: DiagnosticReport<T, C, M>,
  ): Diagnostic {
    const diagnosticDef = diagnostics[diagnostic.code];

    if (!diagnosticDef) {
      const codeStr = Object.keys(diagnostics)
        .map((x) => ` - ${x}`)
        .join("\n");
      const code = String(diagnostic.code);
      throw new Error(
        `Unexpected diagnostic code '${code}'. ${errorMessage}. Defined codes:\n${codeStr}`,
      );
    }

    const message = diagnosticDef.messages[diagnostic.messageId ?? "default"];
    if (!message) {
      const codeStr = Object.keys(diagnosticDef.messages)
        .map((x) => ` - ${x}`)
        .join("\n");
      const messageId = String(diagnostic.messageId);
      const code = String(diagnostic.code);
      throw new Error(
        `Unexpected message id '${messageId}'. ${errorMessage} for code '${code}'. Defined codes:\n${codeStr}`,
      );
    }

    const messageStr = typeof message === "string" ? message : message((diagnostic as any).format);

    const result: Diagnostic = {
      code: libraryName ? `${libraryName}/${String(diagnostic.code)}` : diagnostic.code.toString(),
      severity: diagnosticDef.severity,
      message: messageStr,
      target: diagnostic.target,
    };
    if (diagnostic.codefixes) {
      (result as any).codefixes = diagnostic.codefixes;
    }
    return result;
  }

  function reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diagnostic: DiagnosticReport<T, C, M>,
  ) {
    const diag = createDiagnostic(diagnostic);
    program.reportDiagnostic(diag);
  }

  return {
    diagnostics,
    createDiagnostic,
    reportDiagnostic,
  } as any;
}
