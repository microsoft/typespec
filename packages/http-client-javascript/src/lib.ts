import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

export interface JsClientEmitterOptions {
  "package-name"?: string;
}

const EmitterOptionsSchema: JSONSchemaType<JsClientEmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "package-name": { type: "string", nullable: true, default: "test-package" },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "http-client-javascript",
  emitter: {
    options: EmitterOptionsSchema,
  },
  diagnostics: {
    "mixed-part-nonpart": {
      severity: "warning",
      messages: {
        default: "Mixed part and non-part properties in model",
      },
    },
    "operation-not-in-client": {
      severity: "error",
      messages: {
        default: "Tried to get a client from an operation that is not in a client",
      },
    },
    "non-model-parts": {
      severity: "error",
      messages: {
        default: "Non-model parts are not supported",
      },
      description: "Non-model parts are not supported",
    },
    "multiple-auth-schemes-not-yet-supported": {
      severity: "warning",
      messages: {
        default: "Multiple authentication schemes are not yet supported",
      },
      description:
        "Multiple authentication schemes are not yet supported. Falling back to the first one.",
    },
    "key-credential-non-header-not-implemented": {
      severity: "warning",
      messages: {
        default: "Key credential in query or cookie is not implemented",
      },
      description:
        "Key credential in query or cookie is not implemented. Falling back to not sending auth details with the requests",
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
