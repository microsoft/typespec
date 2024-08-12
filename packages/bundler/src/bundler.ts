import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import virtual from "@rollup/plugin-virtual";
import {
  compile,
  getNormalizedAbsolutePath,
  joinPaths,
  NodeHost,
  normalizePath,
  resolvePath,
} from "@typespec/compiler";
import { mkdir, readFile, realpath, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";
import { OutputChunk, rollup, RollupBuild, RollupOptions, watch } from "rollup";
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
  default: string;
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
  const rollupOptions = await createRollupConfig(definition);
  const bundle = await rollup(rollupOptions);

  try {
    return generateTypeSpecBundle(definition, bundle);
  } finally {
    await bundle.close();
  }
}

export async function watchTypeSpecBundle(
  libraryPath: string,
  onBundle: (bundle: TypeSpecBundle) => void
) {
  const definition = await resolveTypeSpecBundleDefinition(libraryPath);
  const rollupOptions = await createRollupConfig(definition);
  const watcher = watch({
    ...rollupOptions,
    watch: {
      skipWrite: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_START":
        break;
      case "BUNDLE_END":
        try {
          const typespecBundle = await generateTypeSpecBundle(definition, event.result);
          onBundle(typespecBundle);
        } finally {
          await event.result.close();
        }
        break;
      case "ERROR":
        // eslint-disable-next-line no-console
        console.error("Error bundling", event.error);
        await event.result?.close();
    }
  });
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
  libraryPath: string
): Promise<TypeSpecBundleDefinition> {
  libraryPath = normalizePath(await realpath(libraryPath));
  const pkg = await readLibraryPackageJson(libraryPath);

  const exports = pkg.exports
    ? Object.fromEntries(
        Object.entries(pkg.exports).filter(([k, v]) => k !== "." && k !== "./testing")
      )
    : {};

  return {
    path: libraryPath,
    main: pkg.main,
    exports,
    packageJson: pkg,
  };
}

async function createRollupConfig(definition: TypeSpecBundleDefinition): Promise<RollupOptions> {
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
    })
  );
  return {
    input: {
      index: "entry.js",
      ...extraEntry,
    },
    output: {
      esModule: true,
    },
    plugins: [
      (virtual as any)({
        "entry.js": content,
      }),
      (commonjs as any)(),
      (json as any)(),
      (nodeResolve as any)({ preferBuiltins: true, browser: true }),
    ],
    external: (id) => {
      return (
        definition.packageJson.peerDependencies &&
        !!Object.keys(definition.packageJson.peerDependencies).find((x) => id.startsWith(x))
      );
    },
    onwarn: (warning, warn) => {
      if (warning.code === "THIS_IS_UNDEFINED" || warning.code === "CIRCULAR_DEPENDENCY") {
        return;
      }
      warn(warning);
    },
  };
}

async function generateTypeSpecBundle(
  definition: TypeSpecBundleDefinition,
  bundle: RollupBuild
): Promise<TypeSpecBundle> {
  const { output } = await bundle.generate({
    dir: "virtual",
  });

  return {
    definition,
    manifest: createManifest(definition),
    files: output
      .filter((x): x is OutputChunk => "code" in x)
      .map((chunk) => {
        const entry = definition.exports[basename(chunk.fileName)];
        return {
          filename: chunk.fileName,
          content: chunk.code,
          export: entry ? getExportEntryPoint(entry) : undefined,
        };
      }),
  };
}

function getExportEntryPoint(value: string | ExportData) {
  return typeof value === "string" ? value : value.default;
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
    getNormalizedAbsolutePath;
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
