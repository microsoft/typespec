import type { OutputFile } from "@alloy-js/core";
import { traverseOutput } from "@alloy-js/core";
import type {
  CompilerHost,
  Decorator,
  Diagnostic,
  Namespace,
  Program,
  SemanticNodeListener,
} from "@typespec/compiler";
import {
  type FunctionValue,
  type PackageJson,
  type SourceLocation,
  compile,
  createDiagnosticCollector,
  createSourceFile,
  getLocationContext,
  getSourceLocation,
  getTypeName,
  joinPaths,
  navigateProgram,
  navigateTypesInNamespace,
  resolvePath,
} from "@typespec/compiler";
import prettier from "prettier";
import { createDiagnostic } from "../ref-doc/lib.js";
import { generateSignatures } from "./components/entity-signatures.js";
import type { DecoratorSignature, EntitySignature, FunctionSignature } from "./types.js";

function createSourceLocation(path: string): SourceLocation {
  return { file: createSourceFile("", path), pos: 0, end: 0 };
}

/** The root export subpath. */
const ROOT_EXPORT = ".";

/** JS conditions that could resolve to the module exporting `$decorators`/`$functions`. */
const JS_EXPORT_CONDITIONS = ["import", "default", "types"];

/** A `package.json` export entry that defines a TypeSpec entrypoint. */
export interface TypeSpecExportEntry {
  /** Subpath as defined in the `exports` field. (@example `.` or `./streams`) */
  readonly subpath: string;
  /** Absolute path to the TypeSpec entrypoint for this subpath. */
  readonly typespecEntrypoint: string;
  /** Whether this subpath also resolves to a JS module(where `$decorators` would be exported from). */
  readonly hasJsEntrypoint: boolean;
}

/**
 * Resolve the list of `exports` entries defining a `typespec` condition.
 * The root export(`.`) is always first, the remaining ones keep their `package.json` declaration order.
 */
export function resolveTypeSpecExports(
  libraryPath: string,
  pkgJson: PackageJson,
): TypeSpecExportEntry[] {
  const exports = pkgJson.exports;
  if (typeof exports !== "object" || exports === null || Array.isArray(exports)) {
    return [];
  }

  const entries: TypeSpecExportEntry[] = [];
  for (const [subpath, value] of Object.entries(exports)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue;
    }
    if (!("typespec" in value) || typeof value.typespec !== "string") {
      continue;
    }
    entries.push({
      subpath,
      typespecEntrypoint: resolvePath(libraryPath, value.typespec),
      hasJsEntrypoint: JS_EXPORT_CONDITIONS.some((condition) => condition in value),
    });
  }

  return entries.sort((a, b) => {
    if (a.subpath === b.subpath) return 0;
    if (a.subpath === ROOT_EXPORT) return -1;
    if (b.subpath === ROOT_EXPORT) return 1;
    return 0;
  });
}

/**
 * Resolve which export owns each source file.
 *
 * Exports are processed in order and the first one reaching a file claims it. This means a file
 * shared between the root and a subpath(the common `import "../main.tsp";` case) is owned by the
 * root, and a file shared between 2 sibling subpaths is owned by the first one declared.
 *
 * @param sourceFilesPerExport Source files reachable from each export, in resolution order.
 * @returns For each export, in the same order, the set of source files it owns.
 */
export function resolveSourceFileOwnership(
  sourceFilesPerExport: readonly (readonly string[])[],
): Set<string>[] {
  const claimed = new Set<string>();
  return sourceFilesPerExport.map((sourceFiles) => {
    const owned = new Set<string>();
    for (const sourceFile of sourceFiles) {
      if (claimed.has(sourceFile)) continue;
      claimed.add(sourceFile);
      owned.add(sourceFile);
    }
    return owned;
  });
}

export async function generateExternSignatures(
  host: CompilerHost,
  libraryPath: string,
): Promise<readonly Diagnostic[]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(host, libraryPath);
  if (!pkgJson.exports) {
    return [
      createDiagnostic({
        code: "exports-missing",
        target: createSourceLocation(resolvePath(libraryPath, "package.json")),
      }),
    ];
  }

  const exports = resolveTypeSpecExports(libraryPath, pkgJson);
  if (exports.length > 0) {
    diagnostics.pipe(await generateExternSignatureForExports(host, libraryPath, pkgJson, exports));
  } else {
    diagnostics.add(
      createDiagnostic({
        code: "exports-missing",
        messageId: "missingCondition",
        target: createSourceLocation(resolvePath(libraryPath, "package.json")),
      }),
    );
  }

  return diagnostics.diagnostics;
}

export async function generateExternSignatureForExports(
  host: CompilerHost,
  libraryPath: string,
  pkgJson: PackageJson,
  exports: readonly TypeSpecExportEntry[],
): Promise<[undefined, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  const prettierConfig = await prettier.resolveConfig(libraryPath);

  const programs: Program[] = [];
  for (const entry of exports) {
    programs.push(
      await compile(host, entry.typespecEntrypoint, {
        parseOptions: { comments: true, docs: true },
      }),
    );
  }

  // The same file can be resolved under different paths in different programs when it is reached
  // through a symlink(e.g. a pnpm workspace link), so compare real paths instead.
  const realPaths = new Map<string, string>();
  for (const program of programs) {
    for (const path of program.sourceFiles.keys()) {
      if (realPaths.has(path)) continue;
      realPaths.set(path, await tryRealpath(host, path));
    }
  }
  const ownership = resolveSourceFileOwnership(
    programs.map((program) => [...program.sourceFiles.keys()].map((x) => realPaths.get(x)!)),
  );

  const outDir = resolvePath(libraryPath, "generated-defs");
  try {
    await host.rm(outDir, { recursive: true });
  } catch (e) {}

  for (const [index, entry] of exports.entries()) {
    const ownedSourceFiles = ownership[index];
    const files = await generateExternDecorators(programs[index], pkgJson.name, {
      prettierConfig: prettierConfig ?? undefined,
      subpath: entry.subpath,
      sourceFilter: (path) => ownedSourceFiles.has(realPaths.get(path) ?? path),
      // Without a JS entrypoint there is no module to import `$decorators` from so the typecheck file cannot be generated.
      emitTests: entry.hasJsEntrypoint,
    });

    const entries = Object.entries(files);
    if (entries.length === 0) {
      continue;
    }

    if (!entry.hasJsEntrypoint) {
      diagnostics.add(
        createDiagnostic({
          code: "sub-export-missing-js",
          format: { subpath: entry.subpath },
          target: createSourceLocation(resolvePath(libraryPath, "package.json")),
        }),
      );
    }

    const exportOutDir =
      entry.subpath === ROOT_EXPORT ? outDir : resolvePath(outDir, entry.subpath.slice(2));
    await host.mkdirp(exportOutDir);
    for (const [name, content] of entries) {
      await host.writeFile(resolvePath(exportOutDir, name), content);
    }
  }
  return [undefined, diagnostics.diagnostics];
}

async function readPackageJson(host: CompilerHost, libraryPath: string): Promise<PackageJson> {
  const file = await host.readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(file.text);
}

async function tryRealpath(host: CompilerHost, path: string): Promise<string> {
  try {
    return await host.realpath(path);
  } catch {
    return path;
  }
}

export interface GenerateExternDecoratorOptions {
  /** Render those namespaces only(exclude sub namespaces as well). By default it will include all namespaces. */
  readonly namespaces?: Namespace[];
  readonly prettierConfig?: prettier.Options;
  /**
   * Package export subpath the generated signatures belong to.
   * Used to resolve where `$decorators`/`$functions` are imported from. Defaults to the root(`.`).
   */
  readonly subpath?: string;
  /** Only include entities declared in a source file for which this returns true. */
  readonly sourceFilter?: (sourcePath: string) => boolean;
  /** Whether to emit the `<Namespace>.ts-test.ts` typecheck files. Defaults to `true`. */
  readonly emitTests?: boolean;
}
export async function generateExternDecorators(
  program: Program,
  packageName: string,
  options?: GenerateExternDecoratorOptions,
): Promise<Record<string, string>> {
  const entities = new Map<string, EntitySignature[]>();

  function isIncluded(type: Decorator | FunctionValue): boolean {
    if (
      packageName !== "@typespec/compiler" &&
      getLocationContext(program, type).type !== "project"
    )
      return false;
    if (options?.sourceFilter === undefined) return true;
    const sourcePath = getSourceLocation(type, { locateId: true })?.file.path;
    return sourcePath !== undefined && options.sourceFilter(sourcePath);
  }

  const listener: SemanticNodeListener = {
    decorator(dec) {
      if (!isIncluded(dec)) {
        return;
      }
      const namespaceName = getTypeName(dec.namespace);
      let entitiesForNamespace = entities.get(namespaceName);
      if (!entitiesForNamespace) {
        entitiesForNamespace = [];
        entities.set(namespaceName, entitiesForNamespace);
      }
      entitiesForNamespace.push(resolveDecoratorSignature(dec));
    },
    function(func) {
      if (!isIncluded(func) || func.namespace === undefined) {
        return;
      }
      const namespaceName = getTypeName(func.namespace);
      let entitiesForNamespace = entities.get(namespaceName);
      if (!entitiesForNamespace) {
        entitiesForNamespace = [];
        entities.set(namespaceName, entitiesForNamespace);
      }
      if (func.name !== undefined) {
        entitiesForNamespace.push(
          resolveFunctionSignature(func as FunctionValue & { name: string }),
        );
      }
    },
  };
  if (options?.namespaces) {
    for (const namespace of options.namespaces) {
      navigateTypesInNamespace(namespace, listener, { skipSubNamespaces: true });
    }
  } else {
    navigateProgram(program, listener);
  }

  function format(value: string) {
    try {
      const formatted = prettier.format(value, {
        ...options?.prettierConfig,
        parser: "typescript",
      });
      return formatted;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error formatting", e);
      return value;
    }
  }

  const files: Record<string, string> = {};
  for (const [ns, nsEntities] of entities.entries()) {
    const output = generateSignatures(program, nsEntities, packageName, ns, {
      subpath: options?.subpath,
      emitTests: options?.emitTests,
    });
    const rawFiles: OutputFile[] = [];
    await traverseOutput(output, {
      visitDirectory: () => {},
      visitFile: (file) => rawFiles.push(file),
    });

    for (const file of rawFiles) {
      if ("contents" in file) {
        files[file.path] = await format(file.contents);
      }
    }
  }
  return files;
}

function resolveDecoratorSignature(decorator: Decorator): DecoratorSignature {
  return {
    kind: "Decorator",
    decorator,
    name: decorator.name,
    jsName: "$" + decorator.name.slice(1),
    typeName: decorator.name[1].toUpperCase() + decorator.name.slice(2) + "Decorator",
    isAuto: decorator.declarationKind === "auto",
  };
}

function resolveFunctionSignature(func: FunctionValue & { name: string }): FunctionSignature {
  return {
    kind: "Function",
    tspFunction: func,
    name: func.name,
    typeName: func.name[0].toUpperCase() + func.name.slice(1) + "FunctionImplementation",
  };
}
