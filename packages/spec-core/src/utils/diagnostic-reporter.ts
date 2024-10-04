import { getSourceLocation, SourceLocation, Type } from "@typespec/compiler";
import pc from "picocolors";
import { logger } from "../logger.js";

export interface Diagnostic {
  message: string;
  target?: Type | string;
}

export interface DiagnosticReporter {
  readonly diagnostics: Diagnostic[];
  reportDiagnostic(diagnostic: Diagnostic): void;
  reportDiagnostics(diagnostic: readonly Diagnostic[]): void;
}

export function createDiagnosticReporter(): DiagnosticReporter {
  const diagnostics: Diagnostic[] = [];
  function reportDiagnostic(diagnostic: Diagnostic) {
    const target = diagnostic.target ? `\n  ${resolveSourceLocation(diagnostic.target)}` : "";
    logger.error(`${pc.red("✘")} ${diagnostic.message}${target}`);
    diagnostics.push(diagnostic);
  }
  return {
    diagnostics,
    reportDiagnostic,
    reportDiagnostics(diagnostics: readonly Diagnostic[]) {
      for (const diagnostic of diagnostics) {
        reportDiagnostic(diagnostic);
      }
    },
  };
}

function resolveSourceLocation(target: Type | string) {
  if (typeof target === "string") {
    return pc.cyan(target);
  }

  const location = getSourceLocation(target);
  return getSourceLocationStr(location);
}

export function getSourceLocationStr(location: SourceLocation) {
  const position = location.file.getLineAndCharacterOfPosition(location.pos);
  const path = pc.cyan(location.file.path);
  const line = pc.yellow(position.line + 1);
  const column = pc.yellow(position.character + 1);
  return `${path}:${line}:${column}`;
}
