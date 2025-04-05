import { compile, joinPaths, NodeHost, normalizePath, resolvePath } from "@typespec/compiler";
import { BuildOptions, BuildResult, context, Plugin } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
import { mkdir, readFile, realpath, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";
import { relativeTo } from "./utils.js";

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
}

interface PackageJson {
  name: string;
  version: string;
  main: string;
  tspMain?: string;
  peerDependencies: string[];
  dependencies: string[];
  exports?: Record<string, string>;
}

export async function createTypeSpecBundle(libraryPath: string): Promise<TypeSpecBundle> {
  const definition = await resolveTypeSpecBundleDefinition(libraryPath);
  const context = await createEsBuildContext(definition);
  try {
    const result = await context.rebuild();
    return resolveTypeSpecBundle(definition, result);
  } finally {
    await context.dispose();
  }
}

export async function watchTypeSpecBundle(
  libraryPath: string,
  onBundle: (bundle: TypeSpecBundle) => void,
) {
  const definition = await resolveTypeSpecBundleDefinition(libraryPath);
  const context = await createEsBuildContext(definition, [
    {
      name: "example",
      setup(build) {
        build.onEnd((result) => {
          const bundle = resolveTypeSpecBundle(definition, result);
          onBundle(bundle);
        });
      },
    },
  ]);
  await context.watch();
}

export async function bundleTypeSpecLibrary(libraryPath: string, outputDir: string) {
  const bundle = await createTypeSpecBundle(libraryPath);
  await mkdir(outputDir, { recursive: true });
  for (const file of bundle.files) {
    await writeFile(joinPaths(outputDir, file.filename), file.content);
  }
  const manifest = createManifest(bundle.definition);
  await writeFile(joinPaths(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
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

async function createEsBuildContext(definition: TypeSpecBundleDefinition, plugins: Plugin[] = []) {
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
        if (
          definition.packageJson.peerDependencies &&
          Object.keys(definition.packageJson.peerDependencies).some((x) => args.path.startsWith(x))
        ) {
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
    plugins: [virtualPlugin, nodeModulesPolyfillPlugin({}), ...plugins],
  });
}

function resolveTypeSpecBundle(
  definition: TypeSpecBundleDefinition,
  result: BuildResult<BuildOptions>,
): TypeSpecBundle {
  return {
    definition,
    manifest: createManifest(definition),
    files: result.outputFiles!.map((file) => {
      const entry = definition.exports[basename(file.path)];
      return {
        filename: file.path.replaceAll("\\", "/").split("/out/")[1],
        content: file.text,
        export: entry ? getExportEntryPoint(entry) : undefined,
      };
    }),
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
