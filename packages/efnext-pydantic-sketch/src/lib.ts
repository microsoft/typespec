import { JSONSchemaType, createTypeSpecLibrary } from "@typespec/compiler";

export interface PydanticEmitterOptions {
  "output-file"?: string;
}

const PydanticEmitterOptionsSchema: JSONSchemaType<PydanticEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": { type: "string", nullable: true },
  },
  required: [],
};

const libName = "typespec-pydantic-alloy";

export const $lib = createTypeSpecLibrary({
  name: libName,
  diagnostics: {
    "unexpected-error": {
      severity: "error",
      messages: {
        default: "An unexpected error occurred. Please file an issue.",
      },
    },
  },
  emitter: {
    options: PydanticEmitterOptionsSchema,
  },
} as const);

// Optional but convenient, those are meant to be used locally in your library.
export const { reportDiagnostic, createDiagnostic, createStateSymbol } = $lib;
