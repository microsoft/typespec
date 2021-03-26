import { CharacterCodes } from "./character-codes.js";
import { Message, Node, SourceLocation, SyntaxKind, Type, Sym, SourceFile } from "./types.js";

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
    location = createDummySourceLocation();
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

export function createSourceFile(text: string, path: string): SourceFile {
  let lineStarts: Array<number> | undefined = undefined;

  return {
    text,
    path,
    getLineStarts,
    getLineAndCharacterOfPosition,
  };

  function getLineStarts() {
    return (lineStarts = lineStarts ?? scanLineStarts());
  }

  function getLineAndCharacterOfPosition(position: number) {
    const starts = getLineStarts();

    let line = binarySearch(starts, position);

    // When binarySearch returns < 0 indicating that the value was not found, it
    // returns the bitwise complement of the index where the value would need to
    // be inserted to keep the array sorted. So flipping the bits back to this
    // positive index tells us what the line number would be if we were to
    // create a new line starting at the given position, and subtracting 1 from
    // that therefore gives us the line number we're after.
    if (line < 0) {
      line = ~line - 1;
    }

    return {
      line,
      character: position - starts[line],
    };
  }

  function scanLineStarts() {
    const starts = [];
    let start = 0;
    let pos = 0;

    while (pos < text.length) {
      const ch = text.charCodeAt(pos);
      pos++;
      switch (ch) {
        case CharacterCodes.carriageReturn:
          if (text.charCodeAt(pos) === CharacterCodes.lineFeed) {
            pos++;
          }
        // fallthrough
        case CharacterCodes.lineFeed:
        case CharacterCodes.lineSeparator:
        case CharacterCodes.paragraphSeparator:
          starts.push(start);
          start = pos;
          break;
      }
    }

    starts.push(start);
    return starts;
  }

  /**
   * Search sorted array of numbers for the given value. If found, return index
   * in array where value was found. If not found, return a negative number that
   * is the bitwise complement of the index where value would need to be inserted
   * to keep the array sorted.
   */
  function binarySearch(array: ReadonlyArray<number>, value: number) {
    let low = 0;
    let high = array.length - 1;
    while (low <= high) {
      const middle = low + ((high - low) >> 1);
      const v = array[middle];
      if (v < value) {
        low = middle + 1;
      } else if (v > value) {
        high = middle - 1;
      } else {
        return middle;
      }
    }

    return ~low;
  }
}

export function getSourceLocation(target: DiagnosticTarget): SourceLocation {
  if ("file" in target) {
    return target;
  }

  if (target.kind === "decorator") {
    return createDummySourceLocation(target.path);
  }

  const node = "node" in target ? target.node! : target;
  if (node.kind === "Intrinsic") {
    return createDummySourceLocation();
  }
  return getSourceLocationOfNode(node);
}

function createDummySourceLocation(loc = "<unknown location>") {
  return {
    file: createSourceFile("", loc),
    pos: 0,
    end: 0,
  };
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
