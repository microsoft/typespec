import type { CompilerOptions } from "../core/options.js";
import type { Program } from "../core/program.js";
import type { CompilerHost, Diagnostic, Entity, Type } from "../core/types.js";
import type { Typekit } from "../typekit/define-kit.js";
import type { PositionedMarker } from "./fourslash.js";
import type { GetMarkedEntities, TemplateWithMarkers } from "./marked-template.js";

// #region Test file system

/** File contents, or JavaScript exports created with {@link mockFile.js} instead of evaluated source. */
export type MockFile = string | JsFile;

/** An in-memory JavaScript module whose exports are supplied directly to the compiler. */
export interface JsFile {
  /** Distinguishes module exports from a text file. */
  readonly kind: "js";
  /** Named exports returned when the compiler imports this module. */
  readonly exports: Record<string, any>;
}

/**
 * Virtual files and JavaScript modules used by a test compilation.
 * Relative paths resolve under {@link resolveVirtualPath}'s platform-specific test root.
 */
export interface TestFileSystem {
  /** Mutable text-file contents keyed by resolved paths; JavaScript modules have empty text. */
  readonly fs: Map<string, string>;
  /** Host that reads and writes this filesystem and resolves its registered JavaScript exports. */
  readonly compilerHost: CompilerHost;

  /**
   * Add or replace a text file or JavaScript module at the given virtual path.
   * JavaScript source passed as a string is not evaluated; use {@link mockFile.js} for modules.
   * @example
   * ```ts
   * fs.add("foo.tsp", "model Foo {}");
   * fs.add("foo.js", mockFile.js({ Foo: { bar: 1 } }));
   * ```
   */
  add(path: string, content: MockFile): void;

  /** Add or replace a text file. Prefer {@link add} for both text and JavaScript mocks. */
  addTypeSpecFile(path: string, contents: string): void;
  /** Register JavaScript exports without evaluating source. Prefer {@link add} with {@link mockFile.js}. */
  addJsFile(path: string, contents: Record<string, any>): void;
  /** Copy UTF-8 contents from a real filesystem path to a virtual path. */
  addRealTypeSpecFile(path: string, realPath: string): Promise<void>;
  /** Import a real JavaScript module and register its exports at a virtual path. */
  addRealJsFile(path: string, realPath: string): Promise<void>;
  /** Recursively copy a real folder, importing `.js` files as modules and reading other files as text. */
  addRealFolder(path: string, realPath: string): Promise<void>;
  /** Mount the library's file mappings, loading TypeSpec/JSON as text and JavaScript as module exports. */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  addTypeSpecLibrary(testLibrary: TypeSpecTestLibrary): Promise<void>;

  /** @internal */
  freeze(): void;

  /** @internal */
  clone(): TestFileSystem;
}

//#endregion

// #region Tester
/**
 * A compilation's marked entities together with its program, typekit, filesystem, and source positions.
 * Typed markers infer named result properties; plain fourslash markers and `@test` also collect entities.
 * Use unique marker names that do not collide with the result's metadata properties.
 */
export type TestCompileResult<T extends Record<string, Entity>> = T & {
  /** The program created in this test compilation. */
  readonly program: Program;

  /** The typekit for this compilation. */
  readonly $: Typekit;

  /** The mutable filesystem used by this compilation, including any emitted files. */
  readonly fs: TestFileSystem;

  /** Markers keyed by name, with offsets into the full compiled files, including added code and marker comments. */
  readonly pos: Record<keyof T | string, PositionedMarkerInFile>;
} & Record<string, Entity>;

/** Per-compilation settings layered over the tester's defaults. */
export interface TestCompileOptions {
  /**
   * Overrides tester defaults with a shallow merge; `configFile` is also shallow-merged separately.
   * Other nested option objects are replaced rather than deep-merged.
   */
  readonly compilerOptions?: CompilerOptions;
}

/** Compilation operations shared by reusable testers and their mutable instances. */
interface Testable {
  /**
   * Compile the given code and assert that there are no warnings or errors.
   * Use {@link compileAndDiagnose} to get the compiler result and manage diagnostics yourself.
   *
   * @param code Contents of `main.tsp`, or virtual files including `main.tsp`. Additional files must be imported to be compiled.
   * @param options Optional test options.
   * @returns {@link TestCompileResult} with the program and collected entities.
   *
   * @example
   * ```ts
   * const result = await tester.compile(t.code`model ${t.model("Foo")} { bar: string }`);
   * // result.program is the program created
   * // result.Foo is the model Foo created
   * ```
   */
  compile<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
    options?: TestCompileOptions,
  ): Promise<TestCompileResult<GetMarkedEntities<T>>>;
  /**
   * Compile the given `main.tsp` contents and return warnings and errors without asserting they are absent.
   * Marker resolution and kind validation still run and can throw.
   * @param main Contents of `main.tsp`.
   * @param options Optional test options.
   * @returns List of diagnostics emitted.
   *
   * @example
   * ```ts
   * const diagnostics = await tester.diagnose("model Foo {}");
   * expectDiagnostics(diagnostics, {
   *   code: "no-foo",
   *   message: "Do not use Foo as a model name",
   * });
   * ```
   */
  diagnose(main: string, options?: TestCompileOptions): Promise<readonly Diagnostic[]>;

  /**
   * Compile the given code and return the collected entities and diagnostics without asserting success.
   * Marker resolution and kind validation still run and can throw even when diagnostics are returned.
   *
   * @param code Contents of `main.tsp`, or virtual files including `main.tsp`. Additional files must be imported to be compiled.
   * @param options Optional test options.
   * @returns {@link TestCompileResult} with the program and collected entities with the list of diagnostics emitted.
   *
   * @example
   * ```ts
   * const [result, diagnostics] = await tester.compileAndDiagnose(t.code`model ${t.model("Foo")} { bar: string }`);
   * // result.program is the program created
   * // result.Foo is the model Foo created
   * ```
   */
  compileAndDiagnose<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult<GetMarkedEntities<T>>, readonly Diagnostic[]]>;
}

/** Immutable configuration steps; each returns a new tester without changing the original. */
export interface TesterBuilder<T> {
  /** Add or replace virtual files for subsequent compilations; does not automatically import them. */
  files(files: Record<string, MockFile>): T;
  /** Append imports for the libraries configured at tester creation to `main.tsp`. */
  importLibraries(): T;
  /** Append imports to the generated `main.tsp` prefix, in the supplied order. */
  import(...imports: string[]): T;
  /** Append `using` statements after the generated imports in `main.tsp`. */
  using(...names: string[]): T;
  /** Transform only `main.tsp` contents, in chaining order, before imports and usings are prepended. */
  wrap(fn: (x: string) => string): T;
}

/**
 * Reusable, immutable test configuration. Each compilation creates a fresh mutable instance.
 * Use {@link createInstance} to add files directly or retain a filesystem across compilations.
 */
export interface Tester extends Testable, TesterBuilder<Tester> {
  /**
   * Create a tester that runs the named emitter and collects its output files.
   * The emitter must be available in the virtual filesystem, for example through the configured libraries.
   * @param options - Options to pass to the emitter
   */
  emit(emitter: string, options?: Record<string, unknown>): EmitterTester;
  /** Create an isolated mutable filesystem with this tester's libraries, files, and configuration. */
  createInstance(): Promise<TesterInstance>;
}

/** Program and collected text files produced by an emitter test before any `pipe` transformation. */
export interface TestEmitterCompileResult {
  /** The program created in this test compilation. */
  readonly program: Program;

  /** Text files under the emitter output directory, keyed by paths relative to that directory. */
  readonly outputs: Record<string, string>;
}

/**
 * Compilation operations returning emitter output or its piped representation.
 * Strings provide `main.tsp`; file records must supply it or use one already in the instance filesystem.
 * The configured emitter is run with `outputDir` set to `tsp-output`; per-call `emit` is rejected.
 */
export interface OutputTestable<Result> {
  /** Compile and return the output, asserting that there are no warnings or errors. */
  compile(code: string | Record<string, string>, options?: TestCompileOptions): Promise<Result>;
  /** Compile and process the output, returning it with all diagnostics without asserting success. */
  compileAndDiagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<[Result, readonly Diagnostic[]]>;
  /** Compile and process the output, returning only diagnostics without asserting success. */
  diagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]>;
}

/** Alternate version of the tester which runs the configured emitter */
export interface EmitterTester<Result = TestEmitterCompileResult>
  extends OutputTestable<Result>, TesterBuilder<EmitterTester<Result>> {
  /**
   * Pipe the output of the emitter into a different structure
   *
   * @example
   * ```ts
   * const MyTester = Tester.emit("my-emitter").pipe((result) => {
   *  return JSON.parse(result.outputs["output.json"]);
   * });
   *
   * const result = await MyTester.compile("model Foo { bar: string }");
   * // result is the parsed JSON from the output.json file
   * ```
   */
  pipe<O>(cb: (result: Result) => O): EmitterTester<O>;

  /** Create a mutable instance of the tester */
  createInstance(): Promise<EmitterTesterInstance<Result>>;
}

/** Mutable test state shared by ordinary and emitter-specific instances. */
export interface TesterInstanceBase {
  /** Most recently compiled program; throws until a compilation has produced a program. */
  get program(): Program;

  /** Typekit for the most recently compiled program; throws before a program is available. */
  get $(): Typekit;

  /** Mutable filesystem retained across calls; files not overwritten by a compilation remain present. */
  readonly fs: TestFileSystem;
}
/** Mutable compilation state created by {@link Tester.createInstance}, isolated from other instances. */
export interface TesterInstance extends TesterInstanceBase, Testable {}

/** Mutable state for repeated emitter compilations, including retained input and output files. */
export interface EmitterTesterInstance<Result> extends TesterInstanceBase, OutputTestable<Result> {}

/** A marker's location in a virtual input file after tester transformations have been applied. */
export interface PositionedMarkerInFile extends PositionedMarker {
  /** Input filename as supplied to the tester, such as `main.tsp`; resolve it with {@link resolveVirtualPath}. */
  readonly filename: string;
}

// #endregion

// #region Legacy Test host
/* eslint-disable @typescript-eslint/no-deprecated -- defining deprecated APIs for backward compatibility */
/** @deprecated Use {@link Tester} */
export interface TestHost extends Pick<
  TestFileSystem,
  | "addTypeSpecFile"
  | "addJsFile"
  | "addRealTypeSpecFile"
  | "addRealJsFile"
  | "addRealFolder"
  | "addTypeSpecLibrary"
  | "compilerHost"
  | "fs"
> {
  program: Program;
  libraries: TypeSpecTestLibrary[];
  testTypes: Record<string, Type>;

  compile(main: string, options?: CompilerOptions): Promise<Record<string, Type>>;
  diagnose(main: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose(
    main: string,
    options?: CompilerOptions,
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
}

/** @deprecated Use {@link Tester} */
export interface TestFiles {
  realDir: string;
  pattern: string;
  virtualPath: string;
}

/** @deprecated Use {@link Tester} */
export interface TypeSpecTestLibraryInit {
  name: string;
  packageRoot: string;
  /**
   * Folder @default "lib"
   */
  typespecFileFolder?: string;

  /**
   * JS files folder. @default "dist/src"
   */
  jsFileFolder?: string;
}

/** @deprecated Use {@link Tester} */
export interface TypeSpecTestLibrary {
  name: string;
  packageRoot: string;
  files: TestFiles[];
}

/** @deprecated Use {@link Tester} */
export interface TestHostConfig {
  libraries?: TypeSpecTestLibrary[];
}

/** @deprecated Use {@link Tester} */
export class TestHostError extends Error {
  constructor(
    message: string,
    public code: "ENOENT" | "ERR_MODULE_NOT_FOUND",
  ) {
    super(message);
  }
}

/** @deprecated Use {@link TesterInstance} */
export interface BasicTestRunner {
  readonly program: Program;
  readonly fs: Map<string, string>;

  /**
   * Position to offset the automatically added code.
   */
  readonly autoCodeOffset: number;

  /**
   * Compile the given code and assert no diagnostics are present.
   */
  compile(code: string, options?: CompilerOptions): Promise<Record<string, Type>>;

  /**
   * Compile the code and return the list of diagnostics.
   */
  diagnose(code: string, options?: CompilerOptions): Promise<readonly Diagnostic[]>;

  /**
   * Compile the code and return the test types as well as the list of diagnostics.
   */
  compileAndDiagnose(
    code: string,
    options?: CompilerOptions,
  ): Promise<[Record<string, Type>, readonly Diagnostic[]]>;
}
/* eslint-enable @typescript-eslint/no-deprecated */
// #endregion
