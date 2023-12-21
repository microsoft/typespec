import { fileURLToPath } from "url";
import { NodeHost, resolvePath } from "../core/index.js";
import { CompilerOptions } from "../core/options.js";
import { findProjectRoot } from "../core/util.js";
import { StandardTestLibrary } from "./test-host.js";
import {
  BasicTestRunner,
  TestHost,
  TypeSpecTestLibrary,
  TypeSpecTestLibraryInit,
} from "./types.js";

/** Find the package root from the provided file */
export function findTestPackageRoot(fileUrl: string): Promise<string> {
  return findProjectRoot(NodeHost, fileURLToPath(fileUrl)) as Promise<string>;
}
/**
 * Define a test library defaulting to the most common library structure.
 * @param init Library configuration.
 * @returns TypeSpec Test library.
 */
export function createTestLibrary(init: TypeSpecTestLibraryInit): TypeSpecTestLibrary {
  const { name } = init;
  const typespecFileFolder = init.typespecFileFolder ?? "lib";
  const jsFileFolder = init.jsFileFolder ?? "dist/src";
  return {
    name,
    packageRoot: init.packageRoot,
    files: [
      { realDir: "", pattern: "package.json", virtualPath: `./node_modules/${name}` },
      {
        realDir: typespecFileFolder,
        pattern: "*.tsp",
        virtualPath: resolvePath(`./node_modules/${name}`, typespecFileFolder),
      },
      {
        realDir: jsFileFolder,
        pattern: "**/*.js",
        virtualPath: resolvePath(`./node_modules/${name}`, jsFileFolder),
      },
    ],
  };
}

export interface TestWrapperOptions {
  wrapper?: (code: string) => string;

  /**
   * List of imports to include automatically.
   */
  autoImports?: string[];

  /**
   * List of usings to include automatically.
   */
  autoUsings?: string[];

  compilerOptions?: CompilerOptions;
}
export function createTestWrapper(
  host: TestHost,
  testWrapperOptions: TestWrapperOptions = {}
): BasicTestRunner {
  const {
    autoImports,
    autoUsings,
    wrapper,
    compilerOptions: defaultCompilerOptions,
  } = testWrapperOptions;
  const autoCode = [
    ...(
      autoImports ?? host.libraries.filter((x) => x !== StandardTestLibrary).map((x) => x.name)
    ).map((x) => `import "${x}";`),
    ...(autoUsings ?? []).map((x) => `using ${x};`),
  ].join("\n");

  const wrap = (code: string) => {
    return `${autoCode}${wrapper ? wrapper(code) : code}`;
  };
  return {
    get program() {
      return host.program;
    },

    fs: host.fs,
    autoCodeOffset: autoCode.length,

    compile: (code: string, options?: CompilerOptions) => {
      host.addTypeSpecFile("./main.tsp", wrap(code));
      return host.compile("./main.tsp", { ...defaultCompilerOptions, ...options });
    },
    diagnose: (code: string, options?: CompilerOptions) => {
      host.addTypeSpecFile("./main.tsp", wrap(code));
      return host.diagnose("./main.tsp", { ...defaultCompilerOptions, ...options });
    },
    compileAndDiagnose: (code: string, options?: CompilerOptions) => {
      host.addTypeSpecFile("./main.tsp", wrap(code));
      return host.compileAndDiagnose("./main.tsp", { ...defaultCompilerOptions, ...options });
    },
  };
}
