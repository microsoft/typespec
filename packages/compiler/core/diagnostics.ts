import { CharCode } from "./charcode.js";
import { formatLog } from "./logger/index.js";
import { reportDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import {
  Diagnostic,
  DiagnosticCreator,
  DiagnosticMap,
  DiagnosticMessages,
  DiagnosticReport,
  DiagnosticResult,
  DiagnosticTarget,
  LogSink,
  Node,
  NodeFlags,
  NoTarget,
  SourceFile,
  SourceLocation,
  SymbolFlags,
  SyntaxKind,
  Type,
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
      const code = String(diagnostic.code);
      throw new Error(
        `Unexpected diagnostic code '${code}'. ${errorMessage}. Defined codes:\n${codeStr}`
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
        `Unexpected message id '${messageId}'. ${errorMessage} for code '${code}'. Defined codes:\n${codeStr}`
      );
    }

    const messageStr = typeof message === "string" ? message : message((diagnostic as any).format);

    return {
      code: libraryName ? `${libraryName}/${String(diagnostic.code)}` : diagnostic.code.toString(),
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
 * Represents a failure while interpreting a projection.
 */
export class ProjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectionError";
  }
}

export type WriteLine = (text?: string) => void;
export type DiagnosticHandler = (diagnostic: Diagnostic) => void;

export function logDiagnostics(diagnostics: readonly Diagnostic[], logger: LogSink) {
  for (const diagnostic of diagnostics) {
    logger.log({
      level: diagnostic.severity,
      message: diagnostic.message,
      code: diagnostic.code,
      sourceLocation: getSourceLocation(diagnostic.target),
    });
  }
}

export function formatDiagnostic(diagnostic: Diagnostic) {
  return formatLog(
    {
      code: diagnostic.code,
      level: diagnostic.severity,
      message: diagnostic.message,
      sourceLocation: getSourceLocation(diagnostic.target),
    },
    { pretty: false }
  );
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

export function getSourceLocation(target: DiagnosticTarget): SourceLocation;
export function getSourceLocation(target: typeof NoTarget | undefined): undefined;
export function getSourceLocation(
  target: DiagnosticTarget | typeof NoTarget | undefined
): SourceLocation | undefined;
export function getSourceLocation(
  target: DiagnosticTarget | typeof NoTarget | undefined
): SourceLocation | undefined {
  if (target === NoTarget || target === undefined) {
    return undefined;
  }

  if ("file" in target) {
    return target;
  }

  if (!("kind" in target)) {
    // symbol
    if (target.flags & SymbolFlags.Using) {
      target = target.symbolSource!;
    }

    if (!target.declarations[0]) {
      return createSyntheticSourceLocation();
    }

    return getSourceLocationOfNode(target.declarations[0]);
  } else if (typeof target.kind === "number") {
    // node
    return getSourceLocationOfNode(target as Node);
  } else {
    // type
    const targetNode = (target as Type).node;

    if (targetNode) {
      return getSourceLocationOfNode(targetNode);
    }

    return createSyntheticSourceLocation();
  }
}

function createSyntheticSourceLocation(loc = "<unknown location>") {
  return {
    file: createSourceFile("", loc),
    pos: 0,
    end: 0,
    isSynthetic: true,
  };
}

function getSourceLocationOfNode(node: Node): SourceLocation {
  let root = node;

  while (root.parent !== undefined) {
    root = root.parent;
  }

  if (root.kind !== SyntaxKind.CadlScript && root.kind !== SyntaxKind.JsSourceFile) {
    return createSyntheticSourceLocation(
      node.flags & NodeFlags.Synthetic
        ? undefined
        : "<unknown location - cannot obtain source location of unbound node - file bug at https://github.com/microsoft/cadl>"
    );
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
export function logVerboseTestOutput(
  messageOrCallback: string | ((log: (message: string) => void) => void)
) {
  if (process.env.CADL_VERBOSE_TEST_OUTPUT) {
    if (typeof messageOrCallback === "string") {
      // eslint-disable-next-line no-console
      console.log(messageOrCallback);
    } else {
      // eslint-disable-next-line no-console
      messageOrCallback(console.log);
    }
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
  if (condition) {
    return;
  }

  if (target) {
    let location: SourceLocation | undefined;
    try {
      location = getSourceLocation(target);
    } catch (err: any) {}

    if (location) {
      const pos = location.file.getLineAndCharacterOfPosition(location.pos);
      const file = location.file.path;
      const line = pos.line + 1;
      const col = pos.character + 1;
      message += `\nOccurred while compiling code in ${file} near line ${line}, column ${col}`;
    }
  }

  throw new Error(message);
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

/**
 * Assert that the input type has one of the kinds provided
 */
export function assertType<TKind extends Type["kind"][]>(
  typeDescription: string,
  t: Type,
  ...kinds: TKind
): asserts t is Type & { kind: TKind[number] } {
  if (kinds.indexOf(t.kind) === -1) {
    throw new ProjectionError(`Expected ${typeDescription} to be type ${kinds.join(", ")}`);
  }
}

/**
 * Report a deprecated diagnostic.
 * @param program Cadl Program.
 * @param message Message describing the deprecation.
 * @param target Target of the deprecation.
 */
export function reportDeprecated(
  program: Program,
  message: string,
  target: DiagnosticTarget | typeof NoTarget
): void {
  reportDiagnostic(program, {
    code: "deprecated",
    format: {
      message,
    },
    target,
  });
}

/**
 * Helper object to collect diagnostics from function following the diagnostics accessor pattern(foo() => [T, Diagnostic[]])
 */
export interface DiagnosticCollector {
  readonly diagnostics: readonly Diagnostic[];

  /**
   * Add a diagnostic to the collection
   * @param diagnostic Diagnostic to add.
   */
  add(diagnostic: Diagnostic): void;

  /**
   * Unwrap the Diagnostic result, add all the diagnostics and return the data.
   * @param result Accessor diagnostic result
   */
  pipe<T>(result: DiagnosticResult<T>): T;

  /**
   * Wrap the given value in a tuple including the diagnostics following the Cadl accessor pattern.
   * @param value Accessor value to return
   * @example return diagnostics.wrap(routes);
   */
  wrap<T>(value: T): DiagnosticResult<T>;
}

/**
 * Create a new instance of the @see DiagnosticCollector.
 */
export function createDiagnosticCollector(): DiagnosticCollector {
  const diagnostics: Diagnostic[] = [];

  return {
    diagnostics,
    add,
    pipe,
    wrap,
  };

  function add(diagnostic: Diagnostic) {
    diagnostics.push(diagnostic);
  }

  function pipe<T>(result: DiagnosticResult<T>): T {
    const [value, diags] = result;
    for (const diag of diags) {
      diagnostics.push(diag);
    }
    return value;
  }

  function wrap<T>(value: T): DiagnosticResult<T> {
    return [value, diagnostics];
  }
}

/**
 * Ignore the diagnostics emitted by the diagnostic accessor pattern and just return the actual result.
 * @param result: Accessor pattern tuple result including the actual result and the list of diagnostics.
 * @returns Actual result.
 */
export function ignoreDiagnostics<T>(result: DiagnosticResult<T>): T {
  return result[0];
}
