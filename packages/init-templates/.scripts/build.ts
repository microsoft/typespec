import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve } from "path/posix";
import { localDir, packageRoot } from "./helpers.js";

const pkgJson = JSON.parse(
  (await readFile(resolve(packageRoot, "package.json"))).toString("utf-8")
);
const minCompilerVersion = pkgJson.version;

const builtInTemplates: Record<string, any> = {
  empty: {
    title: "Empty project",
    description: "Create an empty project.",
    libraries: [],
    compilerVersion: minCompilerVersion,
  },
  rest: {
    title: "Generic Rest API",
    description: "Create a project representing a generic Rest API",
    compilerVersion: minCompilerVersion,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi3"],
    config: {
      emit: ["@typespec/openapi3"],
    },
  },
  "emitter-ts": {
    title: "TypeSpec Emitter (With TypeScript)",
    description: "Create a new package that will be emitting typespec",
    compilerVersion: minCompilerVersion,
    libraries: [],
    config: undefined,
    files: await localDir("emitter-ts"),
  },
};

const distDir = resolve(packageRoot, "dist");
await mkdir(distDir, { recursive: true });
await writeFile(
  resolve(packageRoot, "scaffolding.json"),
  JSON.stringify(builtInTemplates, null, 2)
);
