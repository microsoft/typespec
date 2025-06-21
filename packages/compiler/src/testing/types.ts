import type { CompilerOptions } from "../core/options.js";
import type { Program } from "../core/program.js";
import type { CompilerHost, Diagnostic, Entity, Type } from "../core/types.js";
import { GetMarkedEntities, TemplateWithMarkers } from "./marked-template.js";

// #region Test file system

/** Represent a mock file. Use `mockFile` function to construct */
export type MockFile = string | JsFile;

export interface JsFile {
  readonly kind: "js";
  readonly exports: Record<string, any>;
}

export interface TestFileSystem {
  /** Raw files */
  readonly fs: Map<string, string>;
  /** Compiler host */
  readonly compilerHost: CompilerHost;

  /**
   * Add a mock test file
   * @example
   * ```ts
   * fs.add("foo.tsp", "model Foo {}");
   * fs.add("foo.js", mockFile.js({ Foo: { bar: 1 } }));
   * ```
   */
  add(path: string, content: MockFile): void;

  /** Prefer using {@link add} */
  addTypeSpecFile(path: string, contents: string): void;
  /** Prefer using {@link add} */
  addJsFile(path: string, contents: Record<string, any>): void;
  addRealTypeSpecFile(path: string, realPath: string): Promise<void>;
  addRealJsFile(path: string, realPath: string): Promise<void>;
  addRealFolder(path: string, realPath: string): Promise<void>;
  addTypeSpecLibrary(testLibrary: TypeSpecTestLibrary): Promise<void>;

  /** @internal */
  freeze(): void;

  /** @internal */
  clone(): TestFileSystem;
}

//#endregion

// #region Tester
export type TestCompileResult<T extends Record<string, Entity>> = T & {
  /** The program created in this test compilation. */
  readonly program: Program;

  /** File system */
  readonly fs: TestFileSystem;
} & Record<string, Entity>;

export interface TestCompileOptions {
  /** Optional compiler options */
  readonly compilerOptions?: CompilerOptions;
}

interface Testable {
  /**
   * Compile the given code and validate no diagnostics(error or warnings) are present.
   * Use {@link compileAndDiagnose} to get the compiler result and manage diagnostics yourself.
   *
   * @param code Can be the content of the `main.tsp` file or a record of files(MUST contains a main.tsp).
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
   * Compile the given code and return the list of diagnostics emitted.
   * @param code Can be the content of the `main.tsp` file or a record of files(MUST contains a main.tsp).
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
   * Compile the given code and return the collected entities and diagnostics.
   *
   * @param code Can be the content of the `main.tsp` file or a record of files(MUST contains a main.tsp).
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

export interface TesterBuilder<T> {
  /** Extend with the given list of files */
  files(files: Record<string, MockFile>): T;
  /** Auto import all libraries defined in this tester. */
  importLibraries(): T;
  /** Import the given paths */
  import(...imports: string[]): T;
  /** Add using statement for the given namespaces. */
  using(...names: string[]): T;
  /** Wrap the code of the `main.tsp` file */
  wrap(fn: (x: string) => string): T;
}

// Immutable structure meant to be reused
export interface Tester extends Testable, TesterBuilder<Tester> {
  /**
   * Create an emitter tester
   * @param options - Options to pass to the emitter
   */
  emit(emitter: string, options?: Record<string, unknown>): EmitterTester;
  /** Create an instance of the tester */
  createInstance(): Promise<TesterInstance>;
}

export interface TestEmitterCompileResult {
  /** The program created in this test compilation. */
  readonly program: Program;

  /** Files written to the emitter output dir. */
  readonly outputs: Record<string, string>;
}

export interface OutputTestable<Result> {
  compile(code: string | Record<string, string>, options?: TestCompileOptions): Promise<Result>;
  compileAndDiagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<[Result, readonly Diagnostic[]]>;
  diagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]>;
}

/** Alternate version of the tester which runs the configured emitter */
export interface EmitterTester<Result = TestEmitterCompileResult>
  extends OutputTestable<Result>,
    TesterBuilder<EmitterTester<Result>> {
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

export interface TesterInstanceBase {
  /** Program created. Only available after calling `compile`, `diagnose` or `compileAndDiagnose` */
  get program(): Program;

  /** File system used */
  readonly fs: TestFileSystem;
}
/** Instance of a tester.  */
export interface TesterInstance extends TesterInstanceBase, Testable {}

/** Instance of an emitter tester */
export interface EmitterTesterInstance<Result> extends TesterInstanceBase, OutputTestable<Result> {}

// #endregion

// #region Legacy Test host
export interface TestHost
  extends Pick<
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

export interface TestFiles {
  realDir: string;
  pattern: string;
  virtualPath: string;
}

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

export interface TypeSpecTestLibrary {
  name: string;
  packageRoot: string;
  files: TestFiles[];
}

export interface TestHostConfig {
  libraries?: TypeSpecTestLibrary[];
}

export class TestHostError extends Error {
  constructor(
    message: string,
    public code: "ENOENT" | "ERR_MODULE_NOT_FOUND",
  ) {
    super(message);
  }
}

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
// #endregion
