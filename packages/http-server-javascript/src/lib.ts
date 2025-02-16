// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { JSONSchemaType, createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export interface JsEmitterOptions {
  express?: boolean;
  "omit-unreachable-types": boolean;
  "no-format": boolean;
}

const EmitterOptionsSchema: JSONSchemaType<JsEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    express: { type: "boolean", nullable: true, default: false },
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
  name: "@typespec/http-server-javascript",
  requireImports: [],
  emitter: {
    options: EmitterOptionsSchema,
  },
  diagnostics: {
    "unrecognized-intrinsic": {
      severity: "warning",
      messages: {
        default: paramMessage`unrecognized intrinsic '${"intrinsic"}' is treated as 'unknown'`,
      },
    },
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
    "undifferentiable-route": {
      severity: "error",
      messages: {
        default: "Shared route cannot be differentiated from other routes.",
      },
    },
    "undifferentiable-scalar": {
      severity: "error",
      messages: {
        default: paramMessage`Scalar type cannot be differentiated from other scalar type '${"competitor"}'.`,
      },
    },
    "undifferentiable-model": {
      severity: "error",
      messages: {
        default:
          "Model type does not have enough unique properties to be differentiated from other models in some contexts.",
      },
    },
    "unrepresentable-numeric-constant": {
      severity: "error",
      messages: {
        default: "JavaScript cannot accurately represent this numeric constant.",
      },
    },
    "undifferentiable-union-variant": {
      severity: "error",
      messages: {
        default:
          "Union variant cannot be differentiated from other variants of the union an an ambiguous context.",
      },
    },
    "unspeakable-status-code": {
      severity: "error",
      messages: {
        default: paramMessage`Status code property '${"name"}' is unspeakable and does not have an exact value. Provide an exact status code value or rename the property.`,
      },
    },
    "name-conflict": {
      severity: "error",
      messages: {
        default: paramMessage`Name ${"name"} conflicts with a prior declaration and must be unique.`,
      },
    },
    "dynamic-request-content-type": {
      severity: "error",
      messages: {
        default: "Operation has multiple possible content-type values and cannot be emitted.",
      },
    },
    "openapi3-document-not-generated": {
      severity: "warning",
      messages: {
        unable:
          "@typespec/openapi3 is installed, but the OpenAPI 3 document could not be generated.",
        versioned:
          "An OpenAPI3 document could not be generated for this service because versioned services are not yet supported by the HTTP server emitter for JavaScript.",
      },
    },
  },
});

const { reportDiagnostic } = $lib;

export { reportDiagnostic };
