import { createSourceFile } from "./scanner.js";
import { Message, Node, SourceLocation, SyntaxKind, Type, Sym } from "./types.js";

/**
 * Represents an error in the code input that is fatal and bails the compilation.
 * 
 * This isn't meant to be kept long term, but we currently do this on all errors.
 */ 
export class DiagnosticError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Represents a failure with multiple errors.
 */
export class ChainedError extends Error {
  readonly innerErrors: readonly Error[];

  constructor(message: string, ...innerErrors: (Error | undefined)[]) {
    super(message);
    this.innerErrors = innerErrors.filter(isNotUndefined);
  }
}

export type DiagnosticTarget = Node | Type | Sym | SourceLocation;

export type ErrorHandler = (message: Message | string, target: DiagnosticTarget, ...args: Array<string | number>) => void;

export const throwOnError: ErrorHandler = throwDiagnostic;

export function throwDiagnostic(message: Message | string,  target: DiagnosticTarget, ...args: Array<string | number>): never {
  throw new DiagnosticError(formatDiagnostic(message, target, ...args));
}

/** 
 * Format a diagnostic into <file>:<line> - ADL<code> <category>: <text>.
 * Take extra care to preserve all info in thrown Error if this fails.
 */
export function formatDiagnostic(message: Message | string, target: DiagnosticTarget, ...args: Array<string | number>) { 
  let location: SourceLocation;
  let locationError: Error | undefined;

  try {
    location = getSourceLocation(target);
  } catch (err) {
    locationError = err;
    location = { 
      file: createSourceFile("", "<unknown location>"),
      pos: 0,
      end: 0
    }
  }

  if (typeof message === 'string') {
    // Temporarily allow ad-hoc strings as error messages.
    message = { code: -1, text: message, category: 'error' }
  }

  const [msg, formatError] = format(message.text, ...args);
  const code = message.code < 0 ? "" : ` ADL${message.code}`;
  const pos = location.file.getLineAndCharacterOfPosition(location.pos);
  const diagnostic = `${location.file.path}:${pos.line + 1}:${pos.character + 1} - ${message.category}${code}: ${msg}`;

  if (locationError || formatError) {
    throw new ChainedError(diagnostic, locationError, formatError);
  }

  return diagnostic;
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
    end: node.end
  }
}

export function dumpError(error: Error, writeLine: (s?: string) => void) {
  writeLine("");
  writeLine(error.stack);

  if (error instanceof ChainedError) {
    for (const inner of error.innerErrors) {
      dumpError(inner, writeLine);
    }
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