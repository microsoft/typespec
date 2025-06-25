import { describe } from "vitest";
import { OpenAPIVersion } from "../src/lib.js";
import {
  diagnoseOpenApiFor,
  emitOpenApiWithDiagnostics,
  oapiForModel,
  openApiFor,
  openapiWithOptions,
} from "./test-host.js";

export const OpenAPISpecHelpers: Record<OpenAPIVersion, SpecHelper> = {
  "3.0.0": createSpecHelpers("3.0.0"),
  "3.1.0": createSpecHelpers("3.1.0"),
};

export type ObjectSchemaIndexer = "additionalProperties" | "unevaluatedProperties";

export type SpecHelper = {
  version: OpenAPIVersion;
  oapiForModel: typeof oapiForModel;
  openApiFor: typeof openApiFor;
  openapiWithOptions: typeof openapiWithOptions;
  checkFor: typeof diagnoseOpenApiFor;
  diagnoseOpenApiFor: typeof diagnoseOpenApiFor;
  emitOpenApiWithDiagnostics: typeof emitOpenApiWithDiagnostics;
  objectSchemaIndexer: ObjectSchemaIndexer;
};

export type WorksForCb = (specHelpers: SpecHelper) => void;

function createSpecHelpers(version: OpenAPIVersion): SpecHelper {
  return {
    version,
    oapiForModel: (...[name, modelDef, options]: Parameters<typeof oapiForModel>) =>
      oapiForModel(name, modelDef, { ...options, "openapi-versions": [version] }),
    openApiFor: (...[code, options]: Parameters<typeof openApiFor>) =>
      openApiFor(code, { ...options, "openapi-versions": [version] }),
    openapiWithOptions: (...[code, options]: Parameters<typeof openapiWithOptions>) =>
      openapiWithOptions(code, { ...options, "openapi-versions": [version] }),
    checkFor: (...[code, options]: Parameters<typeof diagnoseOpenApiFor>) =>
      diagnoseOpenApiFor(code, { ...options, "openapi-versions": [version] }),
    diagnoseOpenApiFor: (...[code, options]: Parameters<typeof diagnoseOpenApiFor>) =>
      diagnoseOpenApiFor(code, { ...options, "openapi-versions": [version] }),
    emitOpenApiWithDiagnostics: (
      ...[code, options]: Parameters<typeof emitOpenApiWithDiagnostics>
    ) => emitOpenApiWithDiagnostics(code, { ...options, "openapi-versions": [version] }),
    objectSchemaIndexer: version === "3.0.0" ? "additionalProperties" : "unevaluatedProperties",
  };
}

export function worksFor(versions: OpenAPIVersion[], cb: WorksForCb) {
  const specsHelpers = versions.map((version) => OpenAPISpecHelpers[version]);
  describe.each(specsHelpers)("openapi $version", (specHelpers) => {
    cb(specHelpers);
  });
}
