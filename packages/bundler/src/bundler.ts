import { compile, joinPaths, NodeHost, normalizePath, resolvePath } from "@typespec/compiler";
import { BuildOptions, BuildResult, context, Plugin } from "esbuild";
import { access, mkdir, readFile, realpath, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import { promisify } from "util";
import { gzip } from "zlib";
import { relativeTo } from "./utils.js";

const gzipAsync = promisify(gzip);

export interface BundleManifest {
  name: string;
  version: string;
  imports: Record<string, string>;
}

export interface TypeSpecBundleDefinition {
  path: string;
  main: string;
  packageJson: PackageJson;
  exports: Record<string, string | ExportData>;
}

export interface ExportData {
  default?: string;
  import?: string;
  types?: string;
  typespec?: string;
}

export interface TypeSpecBundle {
  /**
   * Definition
   */
  definition: TypeSpecBundleDefinition;

  /**
   * Bundle content
   */
  files: TypeSpecBundleFile[];

  /**
   * Resolved manifest.
   */
  manifest: BundleManifest;
}

export interface TypeSpecBundleFile {
  export?: string;
  filename: string;
  content: string;
  /** Gzipped content, only present if gzip option is enabled */
  gzipContent?: Buffer;
}

interface PackageJson {
  name: string;
  version: string;
  main: string;
  tspMain?: string;
  peerDependencies: string[];
  dependencies: string[];
  exports?: Record<string, string | ExportData>;
}

export interface CreateTypeSpecBundleOptions {
  /**
   * Whether to minify the output bundle.
   * @default true
   */
  minify?: boolean;

  /**
   * Whether to also generate gzipped versions of the output files.
   * When enabled, each file will include a gzipContent buffer.
   * @default false
   */
  gzip?: boolean;
}

export async function createTypeSpecBundle(
  libraryPath: string,
  options?: CreateTypeSpecBundleOptions,
): Promise<TypeSpecBundle> {
  const definition = await resolveTypeSpecBundleDefinition(libraryPath);
  const context = await createEsBuildContext(definition, [], options);
  try {
    const result = await context.rebuild();
    return resolveTypeSpecBundle(definition, result, options);
  } finally {
    await context.dispose();
  }
}

export async function watchTypeSpecBundle(
  libraryPath: string,
  onBundle: (bundle: TypeSpecBundle) => void,
  options?: CreateTypeSpecBundleOptions,
) {
  const definition = await resolveTypeSpecBundleDefinition(libraryPath);
  const context = await createEsBuildContext(
    definition,
    [
      {
        name: "example",
        setup(build) {
          build.onEnd(async (result) => {
            const bundle = await resolveTypeSpecBundle(definition, result, options);
            onBundle(bundle);
          });
        },
      },
    ],
    options,
  );
  await context.watch();
}

export async function bundleTypeSpecLibrary(
  libraryPath: string,
  outputDir: string,
  options?: CreateTypeSpecBundleOptions,
) {
  const bundle = await createTypeSpecBundle(libraryPath, options);
  await mkdir(outputDir, { recursive: true });
  for (const file of bundle.files) {
    await writeFile(joinPaths(outputDir, file.filename), file.content);
    if (file.gzipContent) {
      await writeFile(joinPaths(outputDir, file.filename + ".gz"), file.gzipContent);
    }
  }
  const manifest = createManifest(bundle.definition);
  await writeFile(joinPaths(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  if (options?.gzip) {
    const manifestGzip = await gzipAsync(Buffer.from(JSON.stringify(manifest), "utf-8"));
    await writeFile(joinPaths(outputDir, "manifest.json.gz"), manifestGzip);
  }
}

async function resolveTypeSpecBundleDefinition(
  libraryPath: string,
): Promise<TypeSpecBundleDefinition> {
  libraryPath = normalizePath(await realpath(libraryPath));
  const pkg = await readLibraryPackageJson(libraryPath);

  const exports = pkg.exports
    ? Object.fromEntries(
        Object.entries(pkg.exports).filter(
          ([k, v]) => k !== "." && k !== "./testing" && k !== "./internals",
        ),
      )
    : {};

  return {
    path: libraryPath,
    main: pkg.main,
    exports,
    packageJson: pkg,
  };
}

async function createEsBuildContext(
  definition: TypeSpecBundleDefinition,
  plugins: Plugin[] = [],
  options?: CreateTypeSpecBundleOptions,
) {
  const minify = options?.minify ?? true;
  const libraryPath = definition.path;
  const program = await compile(NodeHost, libraryPath, {
    noEmit: true,
  });
  const jsFiles = new Set([resolvePath(libraryPath, definition.packageJson.main)]);
  for (const file of program.jsSourceFiles.keys()) {
    if (file.startsWith(libraryPath)) {
      jsFiles.add(file);
    }
  }
  const typespecFiles: Record<string, string> = {
    [normalizePath(join(libraryPath, "package.json"))]: JSON.stringify(definition.packageJson),
  };

  for (const [filename, sourceFile] of program.sourceFiles) {
    typespecFiles[filename] = sourceFile.file.text;
  }

  // Also compile sub-exports with typespec entry points to include their source files
  for (const [, value] of Object.entries(definition.exports)) {
    const typespecEntry = typeof value === "object" ? value.typespec : undefined;
    if (typespecEntry) {
      const subEntryPoint = resolvePath(libraryPath, typespecEntry);
      const subProgram = await compile(NodeHost, subEntryPoint, {
        noEmit: true,
      });
      for (const file of subProgram.jsSourceFiles.keys()) {
        if (file.startsWith(libraryPath)) {
          jsFiles.add(file);
        }
      }
      for (const [filename, sourceFile] of subProgram.sourceFiles) {
        typespecFiles[filename] = sourceFile.file.text;
      }
    }
  }

  const content = createBundleEntrypoint({
    libraryPath,
    mainFile: definition.main,
    jsSourceFileNames: [...jsFiles],
    typespecSourceFiles: typespecFiles,
  });

  const extraEntry = Object.fromEntries(
    Object.entries(definition.exports).map(([key, value]) => {
      return [
        key.replace("./", ""),
        normalizePath(resolve(libraryPath, getExportEntryPoint(value))),
      ];
    }),
  );

  const externalPeerDeps = await resolveExternalPeerDependencies(libraryPath, definition);

  const virtualPlugin: Plugin = {
    name: "virtual",
    setup(build) {
      build.onResolve({ filter: /^virtual:/ }, (args) => {
        return {
          path: args.path,
          namespace: "virtual",
        };
      });
      build.onResolve({ filter: /.*/ }, (args) => {
        if (externalPeerDeps.some((x) => args.path === x || args.path.startsWith(x + "/"))) {
          return { path: args.path, external: true };
        }
        return null;
      });

      build.onLoad({ filter: /^virtual:/, namespace: "virtual" }, async (args) => {
        return {
          contents: content,
          resolveDir: libraryPath,
        };
      });
    },
  };

  // When containing alloy-js, namespace its globalThis.__ALLOY__ singleton
  // guard so that multiple contained bundles can coexist in the same process.
  const alloySingletonPlugin: Plugin = {
    name: "alloy-singleton-namespace",
    setup(build) {
      build.onLoad({ filter: /reactivity\.[jt]s$/ }, async (args) => {
        if (!args.path.includes("@alloy-js/core")) return undefined;
        const source = await readFile(args.path, "utf-8");
        const namespaceKey = `__ALLOY_${definition.packageJson.name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
        const patched = source.replaceAll("__ALLOY__", namespaceKey);
        return {
          contents: patched,
          loader: args.path.endsWith(".ts") ? "ts" : "js",
        };
      });
    },
  };

  return await context({
    write: false,
    entryPoints: {
      index: "virtual:entry.js",
      ...extraEntry,
    },
    bundle: true,
    splitting: true,
    outdir: "out",
    platform: "browser",
    format: "esm",
    target: "es2024",
    minify,
    keepNames: minify,
    define: {
      "process.env": "{}",
    },
    plugins: [virtualPlugin, alloySingletonPlugin, ...plugins],
  });
}

async function resolveTypeSpecBundle(
  definition: TypeSpecBundleDefinition,
  result: BuildResult<BuildOptions>,
  options?: CreateTypeSpecBundleOptions,
): Promise<TypeSpecBundle> {
  const shouldGzip = options?.gzip ?? false;

  const files: TypeSpecBundleFile[] = await Promise.all(
    result.outputFiles!.map(async (file) => {
      const entry = definition.exports[basename(file.path)];
      const content = file.text;
      const bundleFile: TypeSpecBundleFile = {
        filename: file.path.replaceAll("\\", "/").split("/out/")[1],
        content,
        export: entry ? getExportEntryPoint(entry) : undefined,
      };

      if (shouldGzip) {
        bundleFile.gzipContent = await gzipAsync(Buffer.from(content, "utf-8"));
      }

      return bundleFile;
    }),
  );

  return {
    definition,
    manifest: createManifest(definition),
    files,
  };
}

function getExportEntryPoint(value: string | ExportData) {
  const resolved = typeof value === "string" ? value : (value.import ?? value.default);

  if (!resolved) {
    throw new Error(
      `Exports ${JSON.stringify(value, null, 2)} is missing import or default entrypoint`,
    );
  }

  return resolved;
}
async function readLibraryPackageJson(path: string): Promise<PackageJson> {
  const file = await readFile(join(path, "package.json"));
  return JSON.parse(file.toString());
}

/**
 * Resolve which peer dependencies should be treated as external.
 * Only peer dependencies that are TypeSpec libraries (have `tspMain` in their package.json)
 * are externalized. Non-TypeSpec peer dependencies (e.g. alloy-js) are bundled inline.
 */
async function resolveExternalPeerDependencies(
  libraryPath: string,
  definition: TypeSpecBundleDefinition,
): Promise<string[]> {
  const peerDeps = definition.packageJson.peerDependencies;
  if (!peerDeps) {
    return [];
  }

  const peerDepNames = Object.keys(peerDeps);
  const externalDeps: string[] = [];

  for (const depName of peerDepNames) {
    const isTypeSpec = await isTypeSpecLibrary(libraryPath, depName);
    if (isTypeSpec) {
      externalDeps.push(depName);
    }
  }

  return externalDeps;
}

async function isTypeSpecLibrary(libraryPath: string, depName: string): Promise<boolean> {
  // Walk up from the library path checking node_modules at each level.
  // This avoids require.resolve which fails when packages have exports maps
  // that don't expose ./package.json.
  let dir = libraryPath;
  while (true) {
    const pkgJsonPath = join(dir, "node_modules", depName, "package.json");
    try {
      await access(pkgJsonPath);
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
      continue;
    }
    const depPkgJson = JSON.parse((await readFile(pkgJsonPath)).toString());
    return !!depPkgJson.tspMain;
  }
  // If we can't resolve the package, externalize to be safe (preserves previous behavior)
  return true;
}

/**
 * Create a virtual JS file being the entrypoint of the bundle.
 */
function createBundleEntrypoint({
  libraryPath,
  mainFile,
  jsSourceFileNames,
  typespecSourceFiles,
}: {
  mainFile: string;
  libraryPath: string;
  jsSourceFileNames: string[];
  typespecSourceFiles: Record<string, string>;
}): string {
  const absoluteMain = normalizePath(resolve(libraryPath, mainFile));

  const relativeTypeSpecFiles: Record<string, string> = {};
  for (const [name, content] of Object.entries(typespecSourceFiles)) {
    relativeTypeSpecFiles[relativeTo(libraryPath, name)] = content;
  }
  return [
    `export * from "${absoluteMain}";`,
    ...jsSourceFileNames.map((x, i) => `import * as f${i} from "${x}";`),
    "",
    `const TypeSpecJSSources = {`,
    ...jsSourceFileNames.map((x, i) => `"${relativeTo(libraryPath, x)}": f${i},`),
    "};",

    `const TypeSpecSources = ${JSON.stringify(relativeTypeSpecFiles, null, 2)};`,

    "export const _TypeSpecLibrary_ = {",
    "  jsSourceFiles: TypeSpecJSSources,",
    "  typespecSourceFiles: TypeSpecSources,",
    "};",
  ].join("\n");
}

function createManifest(definition: TypeSpecBundleDefinition): BundleManifest {
  return {
    name: definition.packageJson.name,
    version: definition.packageJson.version,
    imports: createImportMap(definition),
  };
}

function createImportMap(definition: TypeSpecBundleDefinition): Record<string, string> {
  const imports: Record<string, string> = {};
  imports["."] = `./index.js`;
  for (const name of Object.keys(definition.exports)) {
    imports[name] = "./" + resolvePath(name) + ".js";
  }

  return imports;
}
