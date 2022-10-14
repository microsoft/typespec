import {
  compile,
  getNormalizedAbsolutePath,
  joinPaths,
  NodeHost,
  normalizePath,
} from "@cadl-lang/compiler";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import virtual from "@rollup/plugin-virtual";
import { mkdir, readFile, realpath, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";
import { OutputChunk, rollup, RollupBuild, RollupOptions, watch } from "rollup";
import { relativeTo } from "./utils.js";

export interface CadlBundleDefinition {
  path: string;
  main: string;
  packageJson: PackageJson;
  exports: Record<string, string>;
}

export interface CadlBundle {
  /**
   * Definition
   */
  definition: CadlBundleDefinition;

  /**
   * Bundle content
   */
  files: CadlBundleFile[];
}

export interface CadlBundleFile {
  export?: string;
  filename: string;
  content: string;
}

interface PackageJson {
  name: string;
  main: string;
  cadlMain?: string;
  peerDependencies: string[];
  dependencies: string[];
  exports?: Record<string, string>;
}

export async function createCadlBundle(libraryPath: string): Promise<CadlBundle> {
  const definition = await resolveCadlBundleDefinition(libraryPath);
  const rollupOptions = await createRollupConfig(definition);
  const bundle = await rollup(rollupOptions);

  try {
    return generateCadlBundle(definition, bundle);
  } finally {
    await bundle.close();
  }
}

export async function watchCadlBundle(libraryPath: string, onBundle: (bundle: CadlBundle) => void) {
  const definition = await resolveCadlBundleDefinition(libraryPath);
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
          const cadlBundle = await generateCadlBundle(definition, event.result);
          onBundle(cadlBundle);
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

export async function bundleCadlLibrary(libraryPath: string, outputDir: string) {
  const bundle = await createCadlBundle(libraryPath);
  await mkdir(outputDir, { recursive: true });
  for (const file of bundle.files) {
    await writeFile(joinPaths(outputDir, file.filename), file.content);
  }
}

async function resolveCadlBundleDefinition(libraryPath: string): Promise<CadlBundleDefinition> {
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

async function createRollupConfig(definition: CadlBundleDefinition): Promise<RollupOptions> {
  const libraryPath = definition.path;
  const program = await compile(NodeHost, libraryPath, {
    noEmit: true,
  });
  const jsFiles: string[] = [];
  for (const file of program.jsSourceFiles.keys()) {
    if (file.startsWith(libraryPath)) {
      jsFiles.push(file);
    }
  }
  const cadlFiles: Record<string, string> = {
    [normalizePath(join(libraryPath, "package.json"))]: JSON.stringify(definition.packageJson),
  };
  for (const [filename, sourceFile] of program.sourceFiles) {
    cadlFiles[filename] = sourceFile.file.text;
  }
  const content = createBundleEntrypoint({
    libraryPath,
    mainFile: definition.main,
    jsSourceFileNames: jsFiles,
    cadlSourceFiles: cadlFiles,
  });

  const extraEntry = Object.fromEntries(
    Object.entries(definition.exports).map(([key, value]) => {
      return [key.replace("./", ""), normalizePath(resolve(libraryPath, value))];
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
      virtual({
        "entry.js": content,
      }),
      commonjs(),
      json(),
      nodeResolve({ preferBuiltins: true, browser: true }),
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

async function generateCadlBundle(
  definition: CadlBundleDefinition,
  bundle: RollupBuild
): Promise<CadlBundle> {
  const { output } = await bundle.generate({
    dir: "virtual",
  });

  return {
    definition,
    files: output
      .filter((x): x is OutputChunk => "code" in x)
      .map((chunk) => {
        return {
          filename: chunk.fileName,
          content: chunk.code,
          export: definition.exports[basename(chunk.fileName)],
        };
      }),
  };
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
  cadlSourceFiles,
}: {
  mainFile: string;
  libraryPath: string;
  jsSourceFileNames: string[];
  cadlSourceFiles: Record<string, string>;
}): string {
  const absoluteMain = normalizePath(resolve(libraryPath, mainFile));

  const relativeCadlFiles: Record<string, string> = {};
  for (const [name, content] of Object.entries(cadlSourceFiles)) {
    relativeCadlFiles[relativeTo(libraryPath, name)] = content;
    getNormalizedAbsolutePath;
  }
  return [
    `export * from "${absoluteMain}";`,
    ...jsSourceFileNames.map((x, i) => `import * as f${i} from "${x}";`),
    "",
    `const CadlJSSources = {`,
    ...jsSourceFileNames.map((x, i) => `"${relativeTo(libraryPath, x)}": f${i},`),
    "};",

    `const CadlSources = ${JSON.stringify(relativeCadlFiles, null, 2)};`,

    "export const _CadlLibrary_ = {",
    "  jsSourceFiles: CadlJSSources,",
    "  cadlSourceFiles: CadlSources,",
    "};",
  ].join("\n");
}
