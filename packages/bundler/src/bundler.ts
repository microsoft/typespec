import { createProgram, NodeHost } from "@cadl-lang/compiler";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import virtual from "@rollup/plugin-virtual";
import { mkdir, readFile, realpath, writeFile } from "fs/promises";
import { dirname, join, relative, resolve } from "path";
import { rollup } from "rollup";

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
  console.log("Bundling", libraryPath);
  const pkg = await readLibraryPackageJson(libraryPath);
  const jsFiles: string[] = [];
  for (const [file, source] of program.jsSourceFiles.entries()) {
    if (file.startsWith(libraryPath)) {
      jsFiles.push(file);
    }
  }
  const cadlFiles: Record<string, string> = {
    "package.json": JSON.stringify(pkg),
  };
  for (const [filename, sourceFile] of program.sourceFiles) {
    cadlFiles[unixify(relative(libraryPath, filename))] = sourceFile.file.text;
  }
  console.log("JS files: for", jsFiles);
  console.log("Content files: ", Object.keys(cadlFiles));
  const content = [
    `export * from "${unixify(resolve(libraryPath, pkg.main))}";`,
    ...jsFiles.map((x, i) => `import * as f${i} from "${x}";`),
    "",
    `const CadlJSSources = {`,
    ...jsFiles.map((x, i) => `"${unixify(relative(libraryPath, x))}": f${i},`),
    "};",

    `const CadlSources = ${JSON.stringify(cadlFiles)};`,

    "export const _CadlLibrary_ = {",
    "  jsSourceFiles: CadlJSSources,",
    "  cadlSourceFiles: CadlSources,",
    "};",
  ].join("\n");

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
      return !!id.match(/^@cadl-lang\/[a-z\-]+$/);
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
  bundle.close();

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

function unixify(path: string): string {
  return path.replace(/\\/g, "/");
}

async function readLibraryPackageJson(path: string): Promise<PackageJson> {
  const file = await readFile(join(path, "package.json"));
  return JSON.parse(file.toString());
}
