import { CompilerHost, Diagnostic, Program, Type } from "../core/index.js";
import { CompilerOptions } from "../core/options.js";

export interface TestFileSystem {
  readonly compilerHost: CompilerHost;
  readonly fs: Map<string, string>;

  addTypeSpecFile(path: string, contents: string): void;
  addJsFile(path: string, contents: Record<string, any>): void;
  addRealTypeSpecFile(path: string, realPath: string): Promise<void>;
  addRealJsFile(path: string, realPath: string): Promise<void>;
  addTypeSpecLibrary(testLibrary: TypeSpecTestLibrary): Promise<void>;
}

export interface TestHost extends TestFileSystem {
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
   * JS files folder. @default "dist"
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
