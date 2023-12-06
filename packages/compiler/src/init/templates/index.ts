import { resolvePath } from "../../index.js";
import { MANIFEST } from "../../manifest.js";
import { InitTemplate } from "../init-template.js";

import { dirname } from "path";
import { fileURLToPath } from "url";

const templateDir = resolvePath(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "src",
  "init",
  "templates"
);

function localFile(templateName: string, path: string) {
  return { path: resolvePath(templateDir, templateName, path), destination: path };
}

export const builtInTemplates: Record<string, InitTemplate> = {
  empty: {
    title: "Empty project",
    description: "Create an empty project.",
    libraries: [],
    compilerVersion: MANIFEST.version,
  },
  rest: {
    title: "Generic Rest API",
    description: "Create a project representing a generic Rest API",
    compilerVersion: MANIFEST.version,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi3"],
    config: {
      emit: ["@typespec/openapi3"],
    },
  },
  "emitter-ts": {
    title: "TypeSpec Emitter (With TypeScript)",
    description: "Create a new package that will be emitting typespec",
    compilerVersion: MANIFEST.version,
    libraries: [],
    config: undefined,
    files: [
      localFile("emitter-ts", "package.json"),
      localFile("emitter-ts", "tsconfig.json"),
      localFile("emitter-ts", "src/index.ts"),
      localFile("emitter-ts", "src/lib.ts"),
      localFile("emitter-ts", "src/emitter.ts"),
    ],
  },
};
