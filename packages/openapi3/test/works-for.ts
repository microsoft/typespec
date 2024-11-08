import { describe } from "vitest";
import { OpenAPIVersion } from "../src/lib.js";
import {
  checkFor,
  diagnoseOpenApiFor,
  emitOpenApiWithDiagnostics,
  oapiForModel,
  openApiFor,
  openapiWithOptions,
} from "./test-host.js";

export const OpenAPISpecHelpers: Record<OpenAPIVersion, SpecHelper> = {
  "3.0.0": {
    version: "3.0.0",
    oapiForModel: (...[name, modelDef, options]: Parameters<typeof oapiForModel>) =>
      oapiForModel(name, modelDef, { ...options, "openapi-versions": ["3.0.0"] }),
    openApiFor: (...[code, versions, options]: Parameters<typeof openApiFor>) =>
      openApiFor(code, versions, { ...options, "openapi-versions": ["3.0.0"] }),
    openapiWithOptions: (...[code, options]: Parameters<typeof openapiWithOptions>) =>
      openapiWithOptions(code, { ...options, "openapi-versions": ["3.0.0"] }),
    checkFor: (...[code, options]: Parameters<typeof checkFor>) =>
      checkFor(code, { ...options, "openapi-versions": ["3.0.0"] }),
    diagnoseOpenApiFor: (...[code, options]: Parameters<typeof diagnoseOpenApiFor>) =>
      diagnoseOpenApiFor(code, { ...options, "openapi-versions": ["3.0.0"] }),
    emitOpenApiWithDiagnostics: (
      ...[code, options]: Parameters<typeof emitOpenApiWithDiagnostics>
    ) => emitOpenApiWithDiagnostics(code, { ...options, "openapi-versions": ["3.0.0"] }),
  },
  "3.1.0": {
    version: "3.1.0",
    oapiForModel: (...[name, modelDef, options]: Parameters<typeof oapiForModel>) =>
      oapiForModel(name, modelDef, { ...options, "openapi-versions": ["3.1.0"] }),
    openApiFor: (...[code, versions, options]: Parameters<typeof openApiFor>) =>
      openApiFor(code, versions, { ...options, "openapi-versions": ["3.1.0"] }),
    openapiWithOptions: (...[code, options]: Parameters<typeof openapiWithOptions>) =>
      openapiWithOptions(code, { ...options, "openapi-versions": ["3.1.0"] }),
    checkFor: (...[code, options]: Parameters<typeof checkFor>) =>
      checkFor(code, { ...options, "openapi-versions": ["3.1.0"] }),
    diagnoseOpenApiFor: (...[code, options]: Parameters<typeof diagnoseOpenApiFor>) =>
      diagnoseOpenApiFor(code, { ...options, "openapi-versions": ["3.1.0"] }),
    emitOpenApiWithDiagnostics: (
      ...[code, options]: Parameters<typeof emitOpenApiWithDiagnostics>
    ) => emitOpenApiWithDiagnostics(code, { ...options, "openapi-versions": ["3.1.0"] }),
  },
};

export type SpecHelper = {
  version: OpenAPIVersion;
  oapiForModel: typeof oapiForModel;
  openApiFor: typeof openApiFor;
  openapiWithOptions: typeof openapiWithOptions;
  checkFor: typeof checkFor;
  diagnoseOpenApiFor: typeof diagnoseOpenApiFor;
  emitOpenApiWithDiagnostics: typeof emitOpenApiWithDiagnostics;
};

export type WorksForCb = (specHelpers: SpecHelper) => void;

export function worksFor(versions: OpenAPIVersion[], cb: WorksForCb) {
  const specsHelpers = versions.map((version) => OpenAPISpecHelpers[version]);
  describe.each(specsHelpers)("openapi $version", (specHelpers) => {
    cb(specHelpers);
  });
}
