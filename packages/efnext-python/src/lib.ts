import { JSONSchemaType, createTypeSpecLibrary } from "@typespec/compiler";

export interface PythonEmitterOptions {
  "output-file"?: string;
}

const PythonEmitterOptionsSchema: JSONSchemaType<PythonEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": { type: "string", nullable: true },
  },
  required: [],
};

const libName = "efnext-python";

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
    options: PythonEmitterOptionsSchema,
  },
} as const);

// Optional but convenient, those are meant to be used locally in your library.
export const { reportDiagnostic, createDiagnostic, createStateSymbol } = $lib;
