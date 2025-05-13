import type { CompilerOptions } from "../core/options.js";
import type { Program } from "../core/program.js";
import type { CompilerHost, Diagnostic, Entity, Type } from "../core/types.js";
import { GetMarkedEntities, TemplateWithMarkers } from "./marked-template.js";

// #region Test file system
export type MockFile = string | JsFile;

export interface JsFile {
  readonly kind: "js";
  readonly exports: Record<string, any>;
}

export interface TestFileSystem {
  /** Raw files */
  readonly fs: Map<string, string>;
  readonly compilerHost: CompilerHost;

  /** Add a mock test file */
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

export interface TestEmitterCompileResult {
  /** The program created in this test compilation. */
  readonly program: Program;

  /** Files written to the emitter output dir. */
  readonly outputs: Record<string, string>;
}

export interface TestCompileOptions {
  /** Optional compiler options */
  readonly options?: CompilerOptions;
}

interface Testable {
  compile<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
    options?: TestCompileOptions,
  ): Promise<TestCompileResult<GetMarkedEntities<T>>>;
  diagnose(main: string, options?: TestCompileOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult<GetMarkedEntities<T>>, readonly Diagnostic[]]>;
}

// Immutable structure meant to be reused
export interface Tester extends Testable {
  /** Extend with the given list of files */
  files(files: Record<string, MockFile>): Tester;
  /** Auto import all libraries defined in this tester. */
  importLibraries(): Tester;
  /** Import the given paths */
  import(...imports: string[]): Tester;
  /** Add using statement for the given namespaces. */
  using(...names: string[]): Tester;
  /** Wrap the code of the `main.tsp` file */
  wrap(fn: (x: string) => string): Tester;
  /** Create an emitter tester */
  emit(emitter: string): EmitterTester;
  /** Create an instance of the tester */
  createInstance(): Promise<TesterInstance>;
}

export interface OutputTester {
  compile(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<TestEmitterCompileResult>;
  compileAndDiagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<[TestEmitterCompileResult, readonly Diagnostic[]]>;
  diagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]>;
}
/** Alternate version of the tester which runs the configured emitter */
export interface EmitterTester extends OutputTester {
  createInstance(): Promise<EmitterTesterInstance>;
}

export interface EmitterTesterInstance extends OutputTester {
  get program(): Program;
  readonly fs: TestFileSystem;
}

export interface TesterInstance extends Testable {
  get program(): Program;
  readonly fs: TestFileSystem;
}
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
