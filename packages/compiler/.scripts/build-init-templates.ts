import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve } from "path/posix";
import type { InitTemplate } from "../src/init/init-template.js";
import { localDir, packageRoot } from "./helpers.js";

const pkgJson = JSON.parse(
  (await readFile(resolve(packageRoot, "package.json"))).toString("utf-8"),
);
const minCompilerVersion = pkgJson.version;

const builtInTemplates: Record<string, InitTemplate> = {
  empty: {
    title: "Empty project",
    description: "Create an empty project.",
    libraries: [],
    compilerVersion: minCompilerVersion,
  },
  rest: {
    title: "Generic REST API",
    description: "Create a project representing a generic REST API",
    compilerVersion: minCompilerVersion,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi", "@typespec/openapi3"],
    emitters: {
      "@typespec/openapi3": {
        selected: true,
        options: {
          "emitter-output-dir": "{output-dir}/schema",
        },
      },
      "@typespec/http-client-csharp": {
        description: "CSharp Client emitter",
        options: {
          "emitter-output-dir": "{output-dir}/clients/csharp",
        },
      },
      "@typespec/http-client-java": {
        description: "Java Client emitter",
        options: {
          "emitter-output-dir": "{output-dir}/clients/java",
        },
      },
      "@typespec/http-client-js": {
        description: "JavaScript Client emitter",
        options: {
          "emitter-output-dir": "{output-dir}/clients/js",
        },
      },
      "@typespec/http-client-python": {
        description: "Python Client emitter",
        options: {
          "emitter-output-dir": "{output-dir}/clients/python",
        },
      },
      "@typespec/http-server-csharp": {
        description: "CSharp server stubs",
        options: {
          "emitter-output-dir": "{output-dir}/server",
        },
      },
      "@typespec/http-server-js": {
        description: "Javascript server stubs",
        options: {
          "emitter-output-dir": "{output-dir}/server",
        },
      },
    },
    files: [...(await localDir("rest"))],
  },
  "library-ts": {
    title: "TypeSpec Library (With TypeScript)",
    description: "Create a new package to add decorators or linters to typespec.",
    compilerVersion: minCompilerVersion,
    libraries: [],
    files: [
      { destination: "main.tsp", skipGeneration: true },
      { destination: "tspconfig.yaml", skipGeneration: true },
      ...(await localDir("library-ts")),
    ],
  },
  "emitter-ts": {
    title: "TypeSpec Emitter (With TypeScript)",
    description: "Create a new package that will be emitting typespec",
    compilerVersion: minCompilerVersion,
    libraries: [],
    files: [
      { destination: "main.tsp", skipGeneration: true },
      { destination: "tspconfig.yaml", skipGeneration: true },
      ...(await localDir("emitter-ts")),
    ],
  },
};

const distDir = resolve(packageRoot, "dist");
await mkdir(distDir, { recursive: true });
await writeFile(
  resolve(packageRoot, "templates", "scaffolding.json"),
  JSON.stringify(builtInTemplates, null, 2),
);
