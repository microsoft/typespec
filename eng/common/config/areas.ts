import { type AreaLabels } from "./labels.js";

/**
 * Set the paths that each area applies to.
 */
export const AreaPaths: Record<keyof typeof AreaLabels, string[]> = {
  "compiler:core": ["packages/compiler/"],
  "compiler:emitter-framework": [],
  ide: ["packages/typespec-vscode", "packages/typespec-vs/"],
  "lib:http": ["packages/http/"],
  "lib:openapi": ["packages/openapi/"],
  "lib:rest": ["packages/rest/"],
  "lib:versioning": ["packages/versioning/"],
  "meta:blog": ["blog/"],
  "meta:website": ["website/"],
  tspd: ["packages/tspd"],
  "emitter:client:csharp": ["packages/http-client-csharp/"],
  "emitter:json-schema": ["packages/json-schema/"],
  "emitter:protobuf": ["packages/protobuf/"],
  "emitter:openapi3": ["packages/openapi3/"],
  "emitter:service:csharp": [],
  "emitter:service:js": [],
  eng: ["eng/", ".github/"],
};
