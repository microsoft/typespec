import { JSONSchemaType, createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { JsEmitterFeature, JsEmitterFeatureOptionsSchema } from "./feature.js";

export interface JsEmitterOptions {
  features: JsEmitterFeature;
  "omit-unreachable-types": boolean;
  "no-format": boolean;
}

const EmitterOptionsSchema: JSONSchemaType<JsEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    features: JsEmitterFeatureOptionsSchema,
    "omit-unreachable-types": {
      type: "boolean",
      default: false,
    },
    "no-format": {
      type: "boolean",
      default: false,
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "tsp-js",
  requireImports: [],
  emitter: {
    options: EmitterOptionsSchema,
  },
  diagnostics: {
    "unrecognized-scalar": {
      severity: "warning",
      messages: {
        default: paramMessage`unrecognized scalar '${"scalar"}' is treated as 'unknown'`,
      },
    },
    "unrecognized-encoding": {
      severity: "error",
      messages: {
        default: paramMessage`unrecognized encoding '${"encoding"}' for type '${"type"}'`,
      },
    },
    "http-emit-disabled": {
      severity: "warning",
      messages: {
        default: "HTTP emit is disabled because the HTTP library returned errors.",
      },
    },
    "no-services-in-program": {
      severity: "warning",
      messages: {
        default: "No services found in program.",
      },
    },
  },
});

const { reportDiagnostic } = $lib;

export { reportDiagnostic };
