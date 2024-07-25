import type { AreaLabels } from "./labels.js";

/**
 * Set the paths that each area applies to.
 */
export const AreaPaths: Record<keyof typeof AreaLabels, string[]> = {
  "compiler:core": ["packages/compiler/"],
  "compiler:emitter-framework": [],
  ide: ["packages/typespec-vscode/", "packages/typespec-vs/"],
  "lib:http": ["packages/http/"],
  "lib:openapi": ["packages/openapi/"],
  "lib:rest": ["packages/rest/"],
  "lib:versioning": ["packages/versioning/"],
  "meta:blog": ["blog/"],
  "meta:website": ["website/"],
  tspd: ["packages/tspd/"],
  "emitter:client:csharp": ["packages/http-client-csharp/"],
  "emitter:client:java": ["packages/http-client-java/"],
  "emitter:json-schema": ["packages/json-schema/"],
  "emitter:protobuf": ["packages/protobuf/"],
  "emitter:openapi3": ["packages/openapi3/"],
  "openapi3:converter": ["packages/openapi3/src/cli/actions/convert/"],
  "emitter:service:csharp": [],
  "emitter:service:js": [],
  eng: ["eng/", ".github/"],
  "ui:playground": ["packages/playground/"],
  "ui:type-graph-viewer": ["packages/html-program-viewer/"],
};

/**
 * Path that should trigger every CI build.
 */
const all = ["eng/common/", "vitest.config.ts"];

/**
 * Path that should trigger all standalone emitter builds
 */
const standaloneEmitters = ["eng/emitter/"];

export const CIRules = {
  CSharp: [...all, ...standaloneEmitters, ...AreaPaths["emitter:client:csharp"], ".editorconfig"],

  Core: [
    "**/*",
    "!.prettierignore", // Prettier is already run as its dedicated CI(via github action)
    "!.prettierrc.json",
    "!cspell.yaml", // CSpell is already run as its dedicated CI(via github action)
    "!esling.config.json", // Eslint is already run as its dedicated CI(via github action)
    ...ignore(standaloneEmitters),
    ...ignore(AreaPaths["emitter:client:csharp"]),
  ],
};

function ignore(paths: string[]) {
  return paths.map((x) => `!${x}`);
}
