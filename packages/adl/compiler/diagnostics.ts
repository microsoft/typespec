import { AssertionError } from "assert";
import { CharacterCodes } from "./character-codes.js";
import {
  Diagnostic,
  Message,
  Node,
  SourceFile,
  SourceLocation,
  Sym,
  SyntaxKind,
  Type,
} from "./types.js";

/**
 * Represents an error in the code input that is fatal and bails the compilation.
 *
 * This isn't meant to be kept long term, but we currently do this on all errors.
 */
export class DiagnosticError extends Error {
  constructor(public readonly diagnostics: readonly Diagnostic[]) {
    super("Code diagnostics. See diagnostics array.");
    // Tests don't have our catch-all handler so log the diagnostic now.
    logVerboseTestOutput((log) => logDiagnostics(diagnostics, log));
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
    // Tests don't have our catch all handler so log the inner errors now.
    logVerboseTestOutput((log) => this.errors.map((e) => dumpError(e, log)));
  }
}

export type DiagnosticTarget = Node | Type | Sym | SourceLocation;
export type WriteLine = (text?: string) => void;

export type ErrorHandler = (
  message: Message | string,
  target: DiagnosticTarget,
  args?: (string | number)[]
) => void;

export const throwOnError: ErrorHandler = throwDiagnostic;

export function throwDiagnostic(
  message: Message | string,
  target: DiagnosticTarget,
  args?: (string | number)[]
): never {
  throw new DiagnosticError([createDiagnostic(message, target, args)]);
}

export function createDiagnostic(
  message: Message | string,
  target: DiagnosticTarget,
  args?: (string | number)[]
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

  const [formattedMessage, formatError] = format(message.text, args);
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
  let lineStarts: number[] | undefined = undefined;

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
  function binarySearch(array: readonly number[], value: number) {
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

/**
 * Verbose output is enabled by default for runs in mocha explorer in VS Code,
 * where the output is nicely associated with the individual test, and disabled
 * by default for command line runs where we don't want to spam the console.
 *
 * If the steps taken to produce the message are expensive, pass a callback
 * instead of producing the message then passing it here only to be dropped
 * when verbose output is disabled.
 */
export function logVerboseTestOutput(messageOrCallback: string | ((log: WriteLine) => void)) {
  if (process.env.ADL_VERBOSE_TEST_OUTPUT) {
    if (typeof messageOrCallback === "string") {
      console.log(messageOrCallback);
    } else {
      messageOrCallback(console.log);
    }
  }
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

/**
 * Use this to report bugs in the compiler, and not errors in the source code
 * being compiled.
 *
 * @param condition Throw if this is not true.
 *
 * @param message Error message.
 *
 * @param target Optional location in source code that might give a clue about
 *               what got the compiler off track.
 */
export function compilerAssert(
  condition: boolean,
  message: string,
  target?: DiagnosticTarget
): asserts condition {
  let locationError: Error | undefined;

  if (condition) {
    return;
  }

  if (target) {
    let location: SourceLocation | undefined;
    try {
      location = getSourceLocation(target);
    } catch (err) {
      locationError = err;
    }

    if (location) {
      const pos = location.file.getLineAndCharacterOfPosition(location.pos);
      const file = location.file.path;
      const line = pos.line + 1;
      const col = pos.character + 1;
      message += `\nOccurred while compiling code in ${file} near line ${line}, column ${col}`;
    }
  }

  const error = new AssertionError({ message });
  if (locationError) {
    throw new AggregateError(error, locationError);
  } else {
    throw error;
  }
}

function format(text: string, args?: (string | number)[]): [string, Error?] {
  let error: Error | undefined;
  const message = text.replace(/{(\d+)}/g, (_match, indexString: string) => {
    const index = Number(indexString);
    if (!args || index >= args.length) {
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
