import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

export interface JsClientEmitterOptions {
  "package-name"?: string;
}

const EmitterOptionsSchema: JSONSchemaType<JsClientEmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "package-name": {
      type: "string",
      nullable: true,
      default: "test-package",
      description: "Name of the package as it will be in package.json",
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-js",
  emitter: {
    options: EmitterOptionsSchema,
  },
  diagnostics: {
    "unknown-encoding": {
      severity: "warning",
      messages: {
        default: "Unknown encoding",
      },
    },
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
    "unsupported-nondiscriminated-union": {
      severity: "warning",
      messages: {
        default: "Unsupported non-discriminated union, skipping deserializer",
      },
    },
    "no-name-type": {
      severity: "warning",
      messages: {
        default: "Trying to get a name from a type that doesn't have a name",
      },
    },
    "symbol-name-not-supported": {
      severity: "error",
      messages: {
        default: "The transform namer doesn't support symbol names",
      },
    },
    "unsupported-content-type": {
      severity: "warning",
      messages: {
        default: "Unsupported content type. Falling back to json",
      },
    },
    "missing-http-parts": {
      severity: "warning",
      messages: {
        default: "The operation is defined as a Multipart operation but has no parts",
      },
    },
    "use-encoding-context-without-provider": {
      severity: "error",
      messages: {
        default: "Trying to use encoding context without a provider",
      },
    },
    "unexpected-non-scalar-type": {
      severity: "error",
      messages: {
        default: "Unexpected non-scalar type when trying to extract Scalar data",
      },
    },
    "client-not-found": {
      severity: "error",
      messages: {
        default: "Client for operation not found",
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
