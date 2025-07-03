import { readFile, realpath } from "fs/promises";
import { pathToFileURL } from "url";
import { compilerAssert } from "../core/diagnostics.js";
import { getEntityName } from "../core/helpers/type-name-utils.js";
import { NodeHost } from "../core/node-host.js";
import { CompilerOptions } from "../core/options.js";
import { getIdentifierContext, getNodeAtPosition } from "../core/parser.js";
import { getRelativePathFromDirectory, joinPaths, resolvePath } from "../core/path-utils.js";
import { Program, compile as coreCompile } from "../core/program.js";
import { createSourceLoader } from "../core/source-loader.js";
import { CompilerHost, Diagnostic, Entity, NoTarget, SourceFile } from "../core/types.js";
import { resolveModule } from "../module-resolver/module-resolver.js";
import { expectDiagnosticEmpty } from "./expect.js";
import { PositionedMarker, extractMarkers } from "./fourslash.js";
import { createTestFileSystem } from "./fs.js";
import { GetMarkedEntities, Marker, TemplateWithMarkers } from "./marked-template.js";
import { StandardTestLibrary, addTestLib } from "./test-compiler-host.js";
import { resolveVirtualPath } from "./test-utils.js";
import type {
  EmitterTester,
  EmitterTesterInstance,
  MockFile,
  TestCompileOptions,
  TestCompileResult,
  TestEmitterCompileResult,
  TestFileSystem,
  Tester,
  TesterBuilder,
  TesterInstance,
} from "./types.js";

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

  const host: CompilerHost = {
    ...NodeHost,
    // We want to keep the original path in the file map but we do still want to resolve the full path when loading JS to prevent duplicate imports.
    realpath: async (x: string) => x,
    getJsImport: async (path: string) => {
      return await import(pathToFileURL(await realpath(path)).href);
    },
  };

  const sl = await createSourceLoader(host);
  const selfName = JSON.parse(await readFile(resolvePath(base, "package.json"), "utf8")).name;
  for (const lib of options.libraries) {
    await sl.importPath(lib, NoTarget, base);

    // We also need to load the library js entrypoint for emitters and linters.
    const resolved = await resolveModule(
      {
        realpath: async (x) => x,
        stat: NodeHost.stat,
        readFile: async (path) => {
          const file = await NodeHost.readFile(path);
          return file.text;
        },
      },
      lib,
      { baseDir: base, conditions: ["import", "default"] },
    );
    if (resolved.type === "module") {
      const virtualPath = computeRelativePath(lib, resolved.mainFile);
      fs.addJsFile(virtualPath, host.getJsImport(resolved.mainFile));
      fs.add(
        resolvePath("node_modules", lib, "package.json"),
        (resolved.manifest as any).file.text,
      );
    }
  }

  await fs.addTypeSpecLibrary(StandardTestLibrary);

  function computeVirtualPath(file: SourceFile): string {
    const context = sl.resolution.locationContexts.get(file);
    compilerAssert(
      context?.type === "library",
      `Unexpected: all source files should be in a library but ${file.path} was in '${context?.type}'`,
    );
    return computeRelativePath(context.metadata.name, file.path);
  }

  function computeRelativePath(libName: string, realPath: string): string {
    const relativePath = getRelativePathFromDirectory(base, realPath, false);
    if (libName === selfName) {
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
  compilerOptions?: CompilerOptions;
}

interface EmitterTesterInternalParams extends TesterInternalParams {
  outputProcess?: (result: any) => any;
  emitter: string;
}

function createTesterBuilder<
  const I extends TesterInternalParams,
  const O extends TesterBuilder<unknown>,
>(params: I, create: (values: I) => O): TesterBuilder<O> {
  return {
    files,
    wrap,
    importLibraries,
    import: importFn,
    using,
  };

  function files(files: Record<string, MockFile>): O {
    const fs = async () => {
      const fs = (await params.fs()).clone();
      for (const [name, value] of Object.entries(files)) {
        fs.add(name, value);
      }
      fs.freeze();
      return fs;
    };
    return create({
      ...params,
      fs,
    });
  }
  function wrap(fn: (x: string) => string): O {
    return create({
      ...params,
      wraps: [...(params.wraps ?? []), fn],
    });
  }

  function importLibraries(): O {
    return create({
      ...params,
      imports: [...(params.imports ?? []), ...params.libraries],
    });
  }

  function importFn(...imports: string[]): O {
    return create({
      ...params,
      imports: [...(params.imports ?? []), ...imports],
    });
  }

  function using(...usings: string[]): O {
    return create({
      ...params,
      usings: [...(params.usings ?? []), ...usings],
    });
  }
}

function createTesterInternal(params: TesterInternalParams): Tester {
  return {
    ...createCompilable(async (...args) => {
      const instance = await createTesterInstance(params);
      return instance.compileAndDiagnose(...args);
    }),
    ...createTesterBuilder(params, createTesterInternal),
    emit,
    createInstance,
  };

  function emit(emitter: string, options?: Record<string, unknown>): EmitterTester {
    return createEmitterTesterInternal<TestEmitterCompileResult>({
      ...params,
      emitter,
      compilerOptions: options
        ? {
            ...params.compilerOptions,
            options: {
              ...params.compilerOptions?.options,
              [emitter]: options,
            },
          }
        : params.compilerOptions,
    });
  }

  function createInstance(): Promise<TesterInstance> {
    return createTesterInstance(params);
  }
}

function createEmitterTesterInternal<Result>(
  params: EmitterTesterInternalParams,
): EmitterTester<Result> {
  return {
    ...createCompilable(async (...args) => {
      const instance = await createEmitterTesterInstance<Result>(params);
      return instance.compileAndDiagnose(...args);
    }),
    ...createTesterBuilder<EmitterTesterInternalParams, EmitterTester<Result>>(
      params,
      createEmitterTesterInternal,
    ),
    pipe: <O>(cb: (previous: Result) => O): EmitterTester<O> => {
      return createEmitterTesterInternal({
        ...params,
        outputProcess: async (result) => {
          return params.outputProcess ? cb(params.outputProcess(result)) : cb(result);
        },
      });
    },
    createInstance: () => createEmitterTesterInstance(params),
  };
}

async function createEmitterTesterInstance<Result>(
  params: EmitterTesterInternalParams,
): Promise<EmitterTesterInstance<Result>> {
  const tester = await createTesterInstance(params);
  return {
    fs: tester.fs,
    ...createCompilable(compileAndDiagnose),
    get program() {
      return tester.program;
    },
  };

  async function compileAndDiagnose(
    code: string | Record<string, string>,
    options?: TestCompileOptions,
  ): Promise<[Result, readonly Diagnostic[]]> {
    if (options?.compilerOptions?.emit !== undefined) {
      throw new Error("Cannot set emit in options.");
    }
    const resolvedOptions: TestCompileOptions = {
      ...options,
      compilerOptions: {
        ...params.compilerOptions,
        ...options?.compilerOptions,
        outputDir: "tsp-output",
        emit: [params.emitter],
      },
    };
    const [result, diagnostics] = await tester.compileAndDiagnose(code, resolvedOptions);
    const outputs: Record<string, string> = {};
    const outputDir =
      resolvedOptions.compilerOptions?.options?.[params.emitter]?.["emitter-output-dir"] ??
      resolveVirtualPath(resolvePath("tsp-output", params.emitter));
    for (const [name, value] of result.fs.fs) {
      if (name.startsWith(outputDir)) {
        const relativePath = name.slice(outputDir.length + 1);
        outputs[relativePath] = value;
      }
    }

    const prep = {
      ...result,
      outputs,
    };
    const final = params.outputProcess ? params.outputProcess(prep) : prep;
    return [final, diagnostics];
  }
}

async function createTesterInstance(params: TesterInternalParams): Promise<TesterInstance> {
  let savedProgram: Program | undefined;
  const fs = (await params.fs()).clone();

  return {
    ...createCompilable(compileAndDiagnose),
    fs,
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
    const typesCollected = addTestLib(fs);
    const { markerPositions, markerConfigs } = addCode(fs, code);

    const program = await coreCompile(
      fs.compilerHost,
      resolveVirtualPath("main.tsp"),
      options?.compilerOptions,
    );
    savedProgram = program;

    const entities = extractMarkedEntities(program, markerPositions, markerConfigs);
    return [{ program, fs, ...typesCollected, ...entities } as any, program.diagnostics];
  }
}

interface PositionedMarkerInFile extends PositionedMarker {
  /** The file where the marker is located */
  readonly filename: string;
}

function extractMarkedEntities(
  program: Program,
  markerPositions: PositionedMarkerInFile[],
  markerConfigs: Record<string, Marker<any, any>>,
) {
  const entities: Record<string, Entity> = {};
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
    const { node: contextNode } = getIdentifierContext(node as any);
    if (contextNode === undefined) {
      throw new Error(
        `Could not find context node for ${name} at ${pos}. File content: ${file.file.text}`,
      );
    }
    const entity = program.checker.getTypeOrValueForNode(contextNode);
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

    entities[name] = entity;
  }
  return entities;
}

export interface Compilable<A extends unknown[], R> {
  compileAndDiagnose(...args: A): Promise<[R, readonly Diagnostic[]]>;
  compile(...args: A): Promise<R>;
  diagnose(...args: A): Promise<readonly Diagnostic[]>;
}
function createCompilable<A extends unknown[], R>(
  fn: (...args: A) => Promise<[R, readonly Diagnostic[]]>,
): Compilable<A, R> {
  return {
    compileAndDiagnose: fn,
    compile: async (...args: A) => {
      const [result, diagnostics] = await fn(...args);
      expectDiagnosticEmpty(diagnostics);
      return result;
    },
    diagnose: async (...args: A) => {
      const [_, diagnostics] = await fn(...args);
      return diagnostics;
    },
  };
}
