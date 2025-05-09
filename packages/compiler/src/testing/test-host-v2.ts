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
import { TemplateWithMarkers } from "./marked-template.js";
import { StandardTestLibrary, createTestFileSystem } from "./test-host.js";
import { resolveVirtualPath } from "./test-utils.js";
import { TestFileSystem } from "./types.js";

// Need a way to combine that with `program`
export type TestCompileResult<T extends Record<string, Entity>> = T;

export interface JsFileDef {
  [key: string]: string | unknown;
}

interface TestCompileOptions {
  readonly files?: Record<string, string | JsFileDef>;
  readonly options?: CompilerOptions;
}

interface Testable {
  compile<T extends Record<string, Entity>>(
    main: string | TemplateWithMarkers<T>,
    options?: TestCompileOptions,
  ): Promise<TestCompileResult<T>>;
  diagnose(main: string, options?: TestCompileOptions): Promise<readonly Diagnostic[]>;
  compileAndDiagnose<T extends Record<string, Entity>>(
    main: string | TemplateWithMarkers<T>,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult<T>, readonly Diagnostic[]]>;
}

// Immutable structure meant to be reused
export interface Tester extends Testable {
  /** Auto import all libraries defined in this tester. */
  importLibraries(): Tester;
  import(...imports: string[]): Tester;
  using(...names: string[]): Tester;
  wrap(fn: (x: string) => string): Tester;
  createInstance(): TesterInstance;
}

export interface TesterInstance extends Testable {
  readonly program: Program;
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
    fs.addTypeSpecFile(resolveVirtualPath(relativePath), file.file.text);
  }
  for (const file of sl.resolution.jsSourceFiles.values()) {
    const relativePath = computeVirtualPath(file.file);
    fs.addJsFile(resolveVirtualPath(relativePath), file.esmExports);
  }
  for (const [path, lib] of sl.resolution.loadedLibraries) {
    fs.addTypeSpecFile(
      resolvePath("node_modules", path, "package.json"),
      (lib.manifest as any).file.text,
    );
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

function createTesterInternal(params: TesterInternalParams): Tester {
  const { compile, compileAndDiagnose, diagnose } = createInstance();
  return {
    compile,
    compileAndDiagnose,
    diagnose,
    wrap,
    importLibraries,
    import: importFn,
    using,
    createInstance,
  };

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
  async function compileAndDiagnose<T extends Record<string, Entity>>(
    code: string | TemplateWithMarkers<T>,
    options?: TestCompileOptions,
  ): Promise<[TestCompileResult<T>, readonly Diagnostic[]]> {
    const fs = await params.fs();
    const types = await addTestLib(fs);

    const imports = (params.imports ?? []).map((x) => `import "${x}";`);
    const usings = (params.usings ?? []).map((x) => `using ${x};`);

    // Support TemplateWithMarkers
    const codeStr = typeof code === "string" ? code : code.code;
    const actualCode = [
      ...imports,
      ...usings,
      params.wraps ? applyWraps(codeStr, params.wraps) : codeStr,
    ].join("\n");

    const markerPositions = extractMarkers(actualCode);

    fs.addTypeSpecFile("main.tsp", actualCode);
    const program = await coreCompile(fs.compilerHost, resolveVirtualPath("main.tsp"));
    savedProgram = program;

    if (typeof code !== "string") {
      const file = program.sourceFiles.get(resolveVirtualPath("main.tsp"));
      if (!file) {
        throw new Error(`Couldn't find main.tsp in program`);
      }
      for (const marker of markerPositions) {
        const { name, pos, end } = marker;
        const markerConfig = code.markers[name];
        const node = getNodeAtPosition(file, pos);
        if (!node) {
          throw new Error(`Could not find node at ${pos}-${end}`);
        }
        const sym = program.checker.resolveRelatedSymbols(node as any)?.[0];
        if (sym === undefined) {
          throw new Error(`Could not find symbol for ${name} at ${pos}-${end}`);
        }
        const entity = program.checker.getTypeOrValueForNode(getSymNode(sym));
        if (entity === null) {
          throw new Error(
            `Expected ${name} to be of entity kind ${markerConfig?.entityKind} but got null (Means a value failed to resolve) at ${pos}-${end}`,
          );
        }
        if (markerConfig) {
          const { entityKind, kind, valueKind } = markerConfig as any;
          if (entity.entityKind !== entityKind) {
            throw new Error(
              `Expected ${name} to be of entity kind ${entityKind} but got (${entity?.entityKind}) ${getEntityName(entity)} at ${pos}-${end}`,
            );
          }
          if (entity.entityKind === "Type" && kind !== undefined && entity.kind !== kind) {
            throw new Error(
              `Expected ${name} to be of kind ${kind} but got (${entity.kind}) ${getEntityName(entity)} at ${pos}-${end}`,
            );
          } else if (
            entity?.entityKind === "Value" &&
            valueKind !== undefined &&
            entity.valueKind !== valueKind
          ) {
            throw new Error(
              `Expected ${name} to be of value kind ${valueKind} but got (${entity.valueKind}) ${getEntityName(entity)} at ${pos}-${end}`,
            );
          }
        }

        (types as any)[name] = entity;
      }
    }
    return [{ program, ...types } as any, program.diagnostics];
  }

  async function compile<T extends Record<string, Entity>>(
    code: string | TemplateWithMarkers<T>,
    options?: TestCompileOptions,
  ): Promise<TestCompileResult<T>> {
    const [result, diagnostics] = await compileAndDiagnose(code, options);
    expectDiagnosticEmpty(diagnostics);
    return result;
  }
  async function diagnose(
    code: string,
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
        if (
          target.kind === "Model" ||
          target.kind === "Scalar" ||
          target.kind === "Namespace" ||
          target.kind === "Enum" ||
          target.kind === "Operation" ||
          target.kind === "ModelProperty" ||
          target.kind === "EnumMember" ||
          target.kind === "Interface" ||
          (target.kind === "Union" && !target.expression)
        ) {
          name = target.name!;
        } else {
          throw new Error("Need to specify a name for test type");
        }
      }

      testTypes[name] = target;
    },
  });
  return testTypes;
}

export interface PositionedMarker {
  name: string;
  pos: number;
  end: number;
}
function extractMarkers(code: string): PositionedMarker[] {
  // Extract TypeScript fourslash-style markers: /*markerName*/
  // Returns an array of Marker objects with name, pos, and end
  const markerRegex = /\/\*([a-zA-Z0-9_]+)\*\//g;
  const markers: PositionedMarker[] = [];
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(code)) !== null) {
    const markerName = match[1];
    // The marker is immediately followed by the identifier
    // Find the next word after the marker
    const afterMarker = code.slice(markerRegex.lastIndex);
    const idMatch = /([a-zA-Z0-9_]+)/.exec(afterMarker);
    if (idMatch) {
      const id = idMatch[1];
      const pos = markerRegex.lastIndex;
      const end = pos + id.length;
      markers.push({ name: markerName, pos, end });
    }
  }
  return markers;
}
