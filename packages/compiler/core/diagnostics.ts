import { AssertionError } from "assert";
import { CharCode } from "./charcode.js";
import { formatLog } from "./logger.js";
import { Program } from "./program.js";
import {
  Diagnostic,
  DiagnosticCreator,
  DiagnosticMap,
  DiagnosticMessages,
  DiagnosticReport,
  DiagnosticTarget,
  LogSink,
  Node,
  NoTarget,
  SourceFile,
  SourceLocation,
  SyntaxKind,
} from "./types.js";

/**
 * Create a new diagnostics creator.
 * @param diagnostics Map of the potential diagnostics.
 * @param libraryName Optional name of the library if in the scope of a library.
 * @returns @see DiagnosticCreator
 */
export function createDiagnosticCreator<T extends { [code: string]: DiagnosticMessages }>(
  diagnostics: DiagnosticMap<T>,
  libraryName?: string
): DiagnosticCreator<T> {
  const errorMessage = libraryName
    ? `It must match one of the code defined in the library '${libraryName}'`
    : "It must match one of the code defined in the compiler.";

  function createDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    diagnostic: DiagnosticReport<T, C, M>
  ): Diagnostic {
    const diagnosticDef = diagnostics[diagnostic.code];

    if (!diagnosticDef) {
      const codeStr = Object.keys(diagnostics)
        .map((x) => ` - ${x}`)
        .join("\n");
      throw new Error(
        `Unexpected diagnostic code '${diagnostic.code}'. ${errorMessage}. Defined codes:\n${codeStr}`
      );
    }

    const message = diagnosticDef.messages[diagnostic.messageId ?? "default"];
    if (!message) {
      const codeStr = Object.keys(diagnosticDef.messages)
        .map((x) => ` - ${x}`)
        .join("\n");
      throw new Error(
        `Unexpected message id '${diagnostic.messageId}'. ${errorMessage} for code '${diagnostic.code}'. Defined codes:\n${codeStr}`
      );
    }

    const messageStr = typeof message === "string" ? message : message((diagnostic as any).format);

    return {
      code: libraryName ? `${libraryName}/${diagnostic.code}` : diagnostic.code.toString(),
      severity: diagnosticDef.severity,
      message: messageStr,
      target: diagnostic.target,
    };
  }

  function reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diagnostic: DiagnosticReport<T, C, M>
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

export type WriteLine = (text?: string) => void;
export type DiagnosticHandler = (diagnostic: Diagnostic) => void;

export function computeTargetLocation(
  target?: DiagnosticTarget | typeof NoTarget
): SourceLocation | undefined {
  let location: SourceLocation | undefined;
  let locationError: Error | undefined;
  if (target !== undefined && target !== NoTarget) {
    try {
      location = getSourceLocation(target);
    } catch (err: any) {
      locationError = err;
      location = createDummySourceLocation();
    }
  }
  if (locationError) {
    const diagnosticError = new Error(
      "Error(s) occurred trying to resolve target: " + target?.toString()
    );
    throw new AggregateError(diagnosticError, locationError);
  }

  return location;
}

export function logDiagnostics(diagnostics: readonly Diagnostic[], logger: LogSink) {
  for (const diagnostic of diagnostics) {
    logger.log({
      level: diagnostic.severity,
      message: diagnostic.message,
      code: diagnostic.code,
      sourceLocation: computeTargetLocation(diagnostic.target),
    });
  }
}

export function formatDiagnostic(diagnostic: Diagnostic) {
  return formatLog({
    code: diagnostic.code,
    level: diagnostic.severity,
    message: diagnostic.message,
    sourceLocation: computeTargetLocation(diagnostic.target),
  });
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
    return (lineStarts = lineStarts ?? scanLineStarts(text));
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

  compilerAssert(root.kind === SyntaxKind.CadlScript, "Cannot obtain source file of unbound node.");

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
export function logVerboseTestOutput(messageOrCallback: string | ((log: LogSink) => void)) {
  if (process.env.CADL_VERBOSE_TEST_OUTPUT) {
    if (typeof messageOrCallback === "string") {
      console.log(messageOrCallback);
    } else {
      messageOrCallback({
        log: ({ message }) => console.log(message),
      });
    }
  }
}

export function dumpError(error: Error, logger: LogSink) {
  if (error instanceof AggregateError) {
    for (const inner of error.errors) {
      dumpError(inner, logger);
    }
  } else {
    logger.log({ level: "info", message: "" });
    logger.log({ level: "error", message: error.stack ?? "" });
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
  condition: any,
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

function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function scanLineStarts(text: string): number[] {
  const starts = [];
  let start = 0;
  let pos = 0;

  while (pos < text.length) {
    const ch = text.charCodeAt(pos);
    pos++;
    switch (ch) {
      case CharCode.CarriageReturn:
        if (text.charCodeAt(pos) === CharCode.LineFeed) {
          pos++;
        }
      // fallthrough
      case CharCode.LineFeed:
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
