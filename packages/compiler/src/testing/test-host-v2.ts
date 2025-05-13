import { readFile } from "fs/promises";
import { getSymNode } from "../core/binder.js";
import { compilerAssert } from "../core/diagnostics.js";
import { getEntityName } from "../core/helpers/type-name-utils.js";
import { NodeHost } from "../core/node-host.js";
import { CompilerOptions } from "../core/options.js";
import { getNodeAtPosition } from "../core/parser.js";
import { getRelativePathFromDirectory, joinPaths, resolvePath } from "../core/path-utils.js";
import { Program, compile as coreCompile } from "../core/program.js";
import { createSourceLoader } from "../core/source-loader.js";
import { Diagnostic, Entity, NoTarget, SourceFile, StringLiteral, Type } from "../core/types.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { PositionedMarker, extractMarkers } from "./fourslash.js";
import { createTestFileSystem } from "./fs.js";
import { GetMarkedEntities, Marker, TemplateWithMarkers } from "./marked-template.js";
import { StandardTestLibrary } from "./test-compiler-host.js";
import { resolveVirtualPath } from "./test-utils.js";
import { MockFile, TestFileSystem } from "./types.js";

// Need a way to combine that with `program`
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

interface TestCompileOptions {
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
  createInstance(): TesterInstance;
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
  createInstance(): EmitterTesterInstance;
}

export interface EmitterTesterInstance extends OutputTester {
  get program(): Program;
}

export interface TesterInstance extends Testable {
  get program(): Program;
}

export interface TesterOptions {
  libraries: string[];
}
export function createTester(base: string, options: TesterOptions): Tester {
  return createTesterInternal({
    fs: once(() => createTesterFs(base, options)),
    libraries: options.libraries,
  });
}

function once<T>(fn: () => Promise<T>): () => Promise<T> {
  let load: Promise<T> | undefined;
  return () => {
    if (load) return load;
    load = fn();
    return load;
  };
}

async function createTesterFs(base: string, options: TesterOptions) {
  const fs = createTestFileSystem();

  const sl = await createSourceLoader({ ...NodeHost, realpath: async (x) => x });
  const selfName = JSON.parse(await readFile(resolvePath(base, "package.json"), "utf8")).name;
  for (const lib of options.libraries) {
    await sl.importPath(lib, NoTarget, base);
  }

  await fs.addTypeSpecLibrary(StandardTestLibrary);

  function computeVirtualPath(file: SourceFile): string {
    const context = sl.resolution.locationContexts.get(file);
    compilerAssert(
      context?.type === "library",
      `Unexpected: all source files should be in a library but ${file.path} was in '${context?.type}'`,
    );
    const relativePath = getRelativePathFromDirectory(base, file.path, false);
    if (context.metadata.name === selfName) {
      return joinPaths("node_modules", selfName, relativePath);
    } else {
      return relativePath;
    }
  }

  for (const file of sl.resolution.sourceFiles.values()) {
    const relativePath = computeVirtualPath(file.file);
    fs.add(resolveVirtualPath(relativePath), file.file.text);
  }
  for (const file of sl.resolution.jsSourceFiles.values()) {
    const relativePath = computeVirtualPath(file.file);
    fs.addJsFile(resolveVirtualPath(relativePath), file.esmExports);
  }
  for (const [path, lib] of sl.resolution.loadedLibraries) {
    fs.add(resolvePath("node_modules", path, "package.json"), (lib.manifest as any).file.text);
  }
  fs.freeze();
  return fs;
}

interface TesterInternalParams {
  fs: () => Promise<TestFileSystem>;
  libraries: string[];
  wraps?: ((code: string) => string)[];
  imports?: string[];
  usings?: string[];
}

interface EmitterTesterInternalParams extends TesterInternalParams {
  emitter: string;
}

function createEmitterTesterInternal(params: EmitterTesterInternalParams): EmitterTester {
  const { compile, compileAndDiagnose, diagnose } = createEmitterTesterInstance(params);
  return {
    compile,
    compileAndDiagnose,
    diagnose,
    createInstance: () => createEmitterTesterInstance(params),
  };
}

function createTesterInternal(params: TesterInternalParams): Tester {
  const { compile, compileAndDiagnose, diagnose } = createInstance();
  return {
    compile,
    compileAndDiagnose,
    diagnose,
    files,
    wrap,
    importLibraries,
    import: importFn,
    using,
    emit,
    createInstance,
  };

  function files(files: Record<string, MockFile>): Tester {
    const fs = async () => {
      const fs = (await params.fs()).clone();
      for (const [name, value] of Object.entries(files)) {
        fs.add(name, value);
      }
      return fs;
    };
    return createTesterInternal({
      ...params,
      fs,
    });
  }
  function wrap(fn: (x: string) => string): Tester {
    return createTesterInternal({
      ...params,
      wraps: [...(params.wraps ?? []), fn],
    });
  }

  function importLibraries(): Tester {
    return createTesterInternal({
      ...params,
      imports: [...(params.imports ?? []), ...params.libraries],
    });
  }

  function importFn(...imports: string[]): Tester {
    return createTesterInternal({
      ...params,
      imports: [...(params.imports ?? []), ...imports],
    });
  }

  function using(...usings: string[]): Tester {
    return createTesterInternal({
      ...params,
      usings: [...(params.usings ?? []), ...usings],
    });
  }
  function emit(emitter: string): EmitterTester {
    return createEmitterTesterInternal({
      ...params,
      emitter,
    });
  }

  function createInstance(): TesterInstance {
    return createTesterInstance({
      ...params,
      fs: async () => {
        const fs = await params.fs();
        return fs.clone();
      },
    });
  }
}

function createEmitterTesterInstance(params: EmitterTesterInternalParams): EmitterTesterInstance {
  const tester = createTesterInstance(params);
  return {
    compile,
    compileAndDiagnose,
    diagnose,
    get program() {
      return tester.program;
    },
  };

  async function compile<T extends string | Record<string, string>>(
    code: T,
    options?: TestCompileOptions,
  ): Promise<TestEmitterCompileResult> {
    const [result, diagnostics] = await compileAndDiagnose(code, options);
    expectDiagnosticEmpty(diagnostics);
    return result;
  }
  async function diagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]> {
    const [_, diagnostics] = await compileAndDiagnose(code, options);
    return diagnostics;
  }
  async function compileAndDiagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<[TestEmitterCompileResult, readonly Diagnostic[]]> {
    if (options?.options?.emit !== undefined) {
      throw new Error("Cannot set emit in options.");
    }
    const resolvedOptions: TestCompileOptions = {
      ...options,
      options: {
        ...options?.options,
        outputDir: "tsp-output",
        emit: [params.emitter],
      },
    };
    const [result, diagnostics] = await tester.compileAndDiagnose(code, resolvedOptions);
    const outputs: Record<string, string> = {};
    const outputDir = resolveVirtualPath(resolvePath("tsp-output", params.emitter));
    for (const [name, value] of result.fs.fs) {
      if (name.startsWith(outputDir)) {
        const relativePath = name.slice(outputDir.length + 1);
        outputs[relativePath] = value;
      }
    }
    return [
      {
        ...result,
        outputs,
      },
      diagnostics,
    ];
  }
}

function createTesterInstance(params: TesterInternalParams): TesterInstance {
  let savedProgram: Program | undefined;

  return {
    compileAndDiagnose,
    compile,
    diagnose,
    get program() {
      if (!savedProgram) {
        throw new Error("Program not initialized. Call compile first.");
      }
      return savedProgram;
    },
  };

  function applyWraps(code: string, wraps: ((code: string) => string)[]): string {
    for (const wrap of wraps) {
      code = wrap(code);
    }
    return code;
  }

  interface PositionedMarkerInFile extends PositionedMarker {
    /** The file where the marker is located */
    readonly filename: string;
  }

  function addCode(
    fs: TestFileSystem,
    code: string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  ): {
    markerPositions: PositionedMarkerInFile[];
    markerConfigs: Record<string, Marker<any, any>>;
  } {
    const markerPositions: PositionedMarkerInFile[] = [];
    const markerConfigs: Record<string, Marker<any, any>> = {};

    function addTsp(filename: string, value: string | TemplateWithMarkers<any>) {
      const codeStr = TemplateWithMarkers.is(value) ? value.code : value;

      const actualCode = filename === "main.tsp" ? wrapMain(codeStr) : codeStr;
      if (TemplateWithMarkers.is(value)) {
        const markers = extractMarkers(actualCode);
        for (const marker of markers) {
          markerPositions.push({ ...marker, filename });
        }
        for (const [markerName, markerConfig] of Object.entries(value.markers)) {
          if (markerConfig) {
            markerConfigs[markerName] = markerConfig;
          }
        }
      }
      fs.addTypeSpecFile(filename, actualCode);
    }

    const files =
      typeof code === "string" || TemplateWithMarkers.is(code) ? { "main.tsp": code } : code;
    for (const [name, value] of Object.entries(files)) {
      addTsp(name, value);
    }

    return { markerPositions, markerConfigs };
  }

  function wrapMain(code: string): string {
    const imports = (params.imports ?? []).map((x) => `import "${x}";`);
    const usings = (params.usings ?? []).map((x) => `using ${x};`);

    const actualCode = [
      ...imports,
      ...usings,
      params.wraps ? applyWraps(code, params.wraps) : code,
    ].join("\n");
    return actualCode;
  }

  async function compileAndDiagnose<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(
    code: T,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult<GetMarkedEntities<T>>, readonly Diagnostic[]]> {
    const fs = await params.fs();
    const typesCollected = addTestLib(fs);
    const { markerPositions, markerConfigs } = addCode(fs, code);

    const program = await coreCompile(
      fs.compilerHost,
      resolveVirtualPath("main.tsp"),
      options?.options,
    );
    savedProgram = program;

    const entities: Record<string, Entity> = { ...typesCollected };
    if (typeof code !== "string") {
      for (const marker of markerPositions) {
        const file = program.sourceFiles.get(resolveVirtualPath(marker.filename));
        if (!file) {
          throw new Error(`Couldn't find ${resolveVirtualPath(marker.filename)} in program`);
        }
        const { name, pos } = marker;
        const markerConfig = markerConfigs[name];
        const node = getNodeAtPosition(file, pos);
        if (!node) {
          throw new Error(`Could not find node at ${pos}`);
        }
        const sym = program.checker.resolveRelatedSymbols(node as any)?.[0];
        if (sym === undefined) {
          throw new Error(
            `Could not find symbol for ${name} at ${pos}. File content: ${file.file.text}`,
          );
        }
        const entity = program.checker.getTypeOrValueForNode(getSymNode(sym));
        if (entity === null) {
          throw new Error(
            `Expected ${name} to be of entity kind ${markerConfig?.entityKind} but got null (Means a value failed to resolve) at ${pos}`,
          );
        }
        if (markerConfig) {
          const { entityKind, kind, valueKind } = markerConfig as any;
          if (entity.entityKind !== entityKind) {
            throw new Error(
              `Expected ${name} to be of entity kind ${entityKind} but got (${entity?.entityKind}) ${getEntityName(entity)} at ${pos}`,
            );
          }
          if (entity.entityKind === "Type" && kind !== undefined && entity.kind !== kind) {
            throw new Error(
              `Expected ${name} to be of kind ${kind} but got (${entity.kind}) ${getEntityName(entity)} at ${pos}`,
            );
          } else if (
            entity?.entityKind === "Value" &&
            valueKind !== undefined &&
            entity.valueKind !== valueKind
          ) {
            throw new Error(
              `Expected ${name} to be of value kind ${valueKind} but got (${entity.valueKind}) ${getEntityName(entity)} at ${pos}`,
            );
          }
        }

        (entities as any)[name] = entity;
      }
    }
    return [{ program, fs, ...entities } as any, program.diagnostics];
  }

  async function compile<
    T extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
  >(code: T, options?: TestCompileOptions): Promise<TestCompileResult<GetMarkedEntities<T>>> {
    const [result, diagnostics] = await compileAndDiagnose(code, options);
    expectDiagnosticEmpty(diagnostics);
    return result;
  }
  async function diagnose(
    code: string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
    options?: TestCompileOptions,
  ): Promise<readonly Diagnostic[]> {
    const [_, diagnostics] = await compileAndDiagnose(code, options);
    return diagnostics;
  }
}

function addTestLib(fs: TestFileSystem): Record<string, Type> {
  const testTypes: Record<string, Type> = {};
  // add test decorators
  fs.addTypeSpecFile(".tsp/test-lib/main.tsp", 'import "./test.js";');
  fs.addJsFile(".tsp/test-lib/test.js", {
    namespace: "TypeSpec",
    $test(_: any, target: Type, nameLiteral?: StringLiteral) {
      let name = nameLiteral?.value;
      if (!name) {
        if ("name" in target && typeof target.name === "string") {
          name = target.name;
        } else {
          throw new Error("Need to specify a name for test type");
        }
      }

      testTypes[name] = target;
    },
  });
  return testTypes;
}
