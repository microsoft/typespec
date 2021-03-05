import { createSourceFile } from "./scanner.js";
import { Message, Node, SourceLocation, SyntaxKind, Type, Sym } from "./types.js";

export interface Diagnostic extends SourceLocation {
  readonly message: string;
  readonly code?: number;
  readonly severity: "warning" | "error";
}

/**
 * Represents an error in the code input that is fatal and bails the compilation.
 *
 * This isn't meant to be kept long term, but we currently do this on all errors.
 */
export class DiagnosticError extends Error {
  constructor(public readonly diagnostics: readonly Diagnostic[]) {
    super("Code diagnostics. See diagnostics array.");
  }
}

/**
 * Represents a failure with multiple errors.
 */
export class AggregateError extends Error {
  readonly errors: readonly Error[];

  constructor(...errors: (Error | undefined)[]) {
    super("Multiple errors. See errors array.");
    this.errors = errors.filter(isNotUndefined);
  }
}

export type DiagnosticTarget = Node | Type | Sym | SourceLocation;
export type WriteLine = (text?: string) => void;

export type ErrorHandler = (
  message: Message | string,
  target: DiagnosticTarget,
  ...args: Array<string | number>
) => void;

export const throwOnError: ErrorHandler = throwDiagnostic;

export function throwDiagnostic(
  message: Message | string,
  target: DiagnosticTarget,
  ...args: Array<string | number>
): never {
  throw new DiagnosticError([createDiagnostic(message, target, ...args)]);
}

export function createDiagnostic(
  message: Message | string,
  target: DiagnosticTarget,
  ...args: Array<string | number>
): Diagnostic {
  let location: SourceLocation;
  let locationError: Error | undefined;

  try {
    location = getSourceLocation(target);
  } catch (err) {
    locationError = err;
    location = {
      file: createSourceFile("", "<unknown location>"),
      pos: 0,
      end: 0,
    };
  }

  if (typeof message === "string") {
    // Temporarily allow ad-hoc strings as error messages.
    message = { text: message, severity: "error" };
  }

  const [formattedMessage, formatError] = format(message.text, ...args);
  const diagnostic = {
    code: message.code,
    severity: message.severity,
    ...location,
    message: formattedMessage,
  };

  if (locationError || formatError) {
    throw new AggregateError(new DiagnosticError([diagnostic]), locationError, formatError);
  }

  return diagnostic;
}

export function logDiagnostics(diagnostics: readonly Diagnostic[], writeLine: WriteLine) {
  for (const diagnostic of diagnostics) {
    writeLine(formatDiagnostic(diagnostic));
  }
}

export function formatDiagnostic(diagnostic: Diagnostic) {
  const code = diagnostic.code ? ` ADL${diagnostic.code}` : "";
  const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.pos);
  const line = pos.line + 1;
  const col = pos.character + 1;
  const severity = diagnostic.severity;
  const path = diagnostic.file.path;
  return `${path}:${line}:${col} - ${severity}${code}: ${diagnostic.message}`;
}

export function getSourceLocation(target: DiagnosticTarget): SourceLocation {
  if ("file" in target) {
    return target;
  }

  if (target.kind === "decorator") {
    return {
      // We currently report all decorators at line 1 of defining .js path.
      file: createSourceFile("", target.path),
      pos: 0,
      end: 0,
    };
  }

  return getSourceLocationOfNode("node" in target ? target.node : target);
}

function getSourceLocationOfNode(node: Node): SourceLocation {
  let root = node;

  while (root.parent !== undefined) {
    root = root.parent;
  }

  if (root.kind !== SyntaxKind.ADLScript) {
    throw new Error("Cannot obtain source file of unbound node.");
  }

  return {
    file: root.file,
    pos: node.pos,
    end: node.end,
  };
}

export function dumpError(error: Error, writeLine: WriteLine) {
  if (error instanceof DiagnosticError) {
    logDiagnostics(error.diagnostics, writeLine);
    writeLine(error.stack);
  } else if (error instanceof AggregateError) {
    for (const inner of error.errors) {
      dumpError(inner, writeLine);
    }
  } else {
    writeLine("");
    writeLine(error.stack);
  }
}

function format(text: string, ...args: Array<string | number>): [string, Error?] {
  let error: Error | undefined;
  const message = text.replace(/{(\d+)}/g, (_match, indexString: string) => {
    const index = Number(indexString);
    if (index >= args.length) {
      error = new Error("Missing format argument.");
      return "<missing argument>";
    }

    return args[index].toString();
  });

  return [message, error];
}

function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
