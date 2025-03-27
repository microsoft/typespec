import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

export interface JsClientEmitterOptions {
  "package-version"?: string;
  "package-name"?: string;
  license?: {
    name: string;
    company?: string;
    link?: string;
    header?: string;
    description?: string;
  };
}

const EmitterOptionsSchema: JSONSchemaType<JsClientEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "package-version": {
      type: "string",
      nullable: true,
      default: "0.0.1",
      description: "The version of the package.",
    },
    "package-name": {
      type: "string",
      nullable: true,
      default: "test-package",
      description: "Name of the package.",
    },
    license: {
      type: "object",
      additionalProperties: false,
      nullable: true,
      required: ["name"],
      properties: {
        name: {
          type: "string",
          nullable: false,
          description:
            "License name. The config is required. Predefined license are: MIT License, Apache License 2.0, BSD 3-Clause License, MPL 2.0, GPL-3.0, LGPL-3.0. For other license, you need to configure all the other license config manually.",
        },
        company: {
          type: "string",
          nullable: true,
          description: "License company name. It will be used in copyright sentences.",
        },
        link: {
          type: "string",
          nullable: true,
          description: "License link.",
        },
        header: {
          type: "string",
          nullable: true,
          description:
            "License header. It will be used in the header comment of generated client code.",
        },
        description: {
          type: "string",
          nullable: true,
          description: "License description. The full license text.",
        },
      },
      description: "License information for the generated client code.",
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
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
