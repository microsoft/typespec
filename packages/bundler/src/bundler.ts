import { createProgram, getNormalizedAbsolutePath, NodeHost } from "@cadl-lang/compiler";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import virtual from "@rollup/plugin-virtual";
import { mkdir, readFile, realpath, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { rollup } from "rollup";
import { relativeTo, unixify } from "./utils.js";

interface PackageJson {
  name: string;
  main: string;
  cadlBundler?: {
    jsInclude: string[];
  };
  cadlMain?: string;
  dependencies: string[];
}

export interface CadlBundle {
  /**
   * Bundle content
   */
  content: string;

  /**
   * List of file used
   */
  sourceFiles: string[];
}

export async function createCadlBundle(libraryPath: string): Promise<CadlBundle> {
  libraryPath = await realpath(libraryPath);
  const program = await createProgram(NodeHost, libraryPath, {
    nostdlib: true,
    noEmit: true,
  });
  const pkg = await readLibraryPackageJson(libraryPath);
  const jsFiles: string[] = [];
  for (const file of program.jsSourceFiles.keys()) {
    if (file.startsWith(libraryPath)) {
      jsFiles.push(file);
    }
  }
  const cadlFiles: Record<string, string> = {
    "package.json": JSON.stringify(pkg),
  };
  for (const [filename, sourceFile] of program.sourceFiles) {
    cadlFiles[filename] = sourceFile.file.text;
  }
  const content = createBundleEntrypoint({
    libraryPath,
    mainFile: pkg.main,
    jsSourceFileNames: jsFiles,
    cadlSourceFiles: cadlFiles,
  });

  const bundle = await rollup({
    input: ["entry.js"],
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
    shimMissingExports: true,
    external: (id) => {
      return !!id.match(/^@cadl-lang\/[a-z-]+$/);
    },
    onwarn: (warning, warn) => {
      if (warning.code === "THIS_IS_UNDEFINED" || warning.code === "CIRCULAR_DEPENDENCY") {
        return;
      }
      warn(warning);
    },
  });
  const { output } = await bundle.generate({
    file: "lib.js",
  });
  await bundle.close();

  return {
    content: output[0].code,
    sourceFiles: [...jsFiles, ...Object.keys(cadlFiles)],
  };
}

export async function bundleCadlLibrary(libraryPath: string, outputFile: string) {
  const bundle = await createCadlBundle(libraryPath);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, bundle.content);
}

async function readLibraryPackageJson(path: string): Promise<PackageJson> {
  const file = await readFile(join(path, "package.json"));
  return JSON.parse(file.toString());
}

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
  const absoluteMain = unixify(resolve(libraryPath, mainFile));

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
