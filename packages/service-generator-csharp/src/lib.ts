import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface CSharpServiceEmitterOptions {
  /**Skip formatting of output. Default is false (generated c-sharp files are formatted) */
  "skip-format"?: boolean;
}

const EmitterOptionsSchema: JSONSchemaType<CSharpServiceEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "skip-format": {
      type: "boolean",
      nullable: true,
      description:
        "Skips formatting of generated C# Types.  By default, C# files are formatted using 'dotnet format'.",
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/service-generator-csharp",
  diagnostics: {
    "invalid-identifier": {
      severity: "warning",
      messages: {
        default: paramMessage`Invalid identifier '${"identifier"}' in ${"location"}`,
      },
    },
    "missing-type-parent": {
      severity: "warning",
      messages: {
        default: paramMessage`No parent found for ${"type"} ${"name"} `,
      },
    },
    "no-numeric": {
      severity: "warning",
      messages: {
        default: paramMessage`Type '${"sourceType"}' is an imprecise type that does not map directly to a single numeric type, using '${"targetType"}' as the safest c# numeric type.  Please specify a more precise numeric type, like 'int32' or 'float64'`,
      },
    },
    "unrecognized-scalar": {
      severity: "warning",
      messages: {
        default: paramMessage`Scalar type ${"typeName"} is not a recognized scalar type.  Please use or extend a built-in scalar type.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<CSharpServiceEmitterOptions>,
  },
  requireImports: [],
} as const);
export const { reportDiagnostic, getTracer } = $lib;
