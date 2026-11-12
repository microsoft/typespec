import type { JSONSchemaType } from "@typespec/compiler";
import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

/**
 * Configuration supplied to the C# server emitter through `EmitContext.options`.
 * In `tspconfig.yaml`, set these under `options["@typespec/http-server-csharp"]`.
 */
export interface CSharpServiceEmitterOptions {
  /**
   * Accepted formatting option. The current emitter does not invoke `dotnet format`,
   * so this option has no effect.
   */
  "skip-format"?: boolean;
  /**
   * Select `"models"` to emit models, enums, and serialization support without
   * controllers, operation interfaces, or project scaffolding. Defaults to `"all"`.
   * Models-only output ignores mock and Swagger UI options.
   */
  "output-type"?: "models" | "all";
  /**
   * Add mock business-logic implementations and their registration helpers.
   * `"mocks-and-project-files"` also emits the project and local hosting settings;
   * `"mocks-only"` omits those project files. Defaults to `"none"`.
   * Ignored when `"output-type"` is `"models"`.
   */
  "emit-mocks"?: "none" | "mocks-only" | "mocks-and-project-files";
  /**
   * Request Swagger UI middleware for the generated service's development environment.
   * Requires an explicit or inferred OpenAPI path. Defaults to `false` and is
   * ignored when `"output-type"` is `"models"`.
   */
  "use-swaggerui"?: boolean;
  /**
   * OpenAPI document path embedded in `Program.cs` when `"use-swaggerui"` is enabled.
   * Relative paths are resolved by the generated service at runtime. When omitted,
   * the emitter infers a path from the `@typespec/openapi3` configuration; if none
   * can be resolved, Swagger UI middleware is not emitted.
   */
  "openapi-path"?: string;
  /**
   * Replace existing files outside `generated/`, including mocks and project scaffolding.
   * Defaults to `false`, preserving those files for user edits. Files in `generated/`
   * are always overwritten.
   */
  overwrite?: boolean;
  /**
   * Base name of the `.csproj` file emitted with `"mocks-and-project-files"`.
   * Defaults to `"ServiceProject"`; does not set the generated C# namespace.
   */
  "project-name"?: string;
  /**
   * HTTP port written to `Properties/launchSettings.json` when project files are emitted.
   * Defaults to `5000`.
   */
  "http-port"?: number;
  /**
   * HTTPS port written to `Properties/launchSettings.json` when project files are emitted.
   * Defaults to `7000`.
   */
  "https-port"?: number;
  /**
   * Represent collections as C# arrays (`"array"`, the default) or `IEnumerable<T>`
   * (`"enumerable"`). Arrays with unique items use `ISet<T>`; other byte arrays remain arrays.
   */
  "collection-type"?: "array" | "enumerable";
}

const EmitterOptionsSchema: JSONSchemaType<CSharpServiceEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "skip-format": {
      type: "boolean",
      nullable: true,
      default: false,
      description:
        "Skips formatting of generated C# Types.  By default, C# files are formatted using 'dotnet format'.",
    },
    "output-type": {
      type: "string",
      enum: ["models", "all"],
      nullable: true,
      default: "all",
      description:
        "Chooses which service artifacts to emit. choices include 'models' or 'all' artifacts.",
    },
    "emit-mocks": {
      type: "string",
      enum: ["mocks-and-project-files", "mocks-only", "none"],
      nullable: true,
      default: "none",
      description:
        "Emits mock implementations of business logic, setup code, and project files, enabling the service to respond to requests before a real implementation is provided",
    },
    "use-swaggerui": {
      type: "boolean",
      nullable: true,
      default: false,
      description: "Configure a Swagger UI endpoint in the development configuration",
    },
    "openapi-path": {
      type: "string",
      nullable: true,
      default: null,
      description:
        "Use openapi at the given path for generating SwaggerUI endpoints. By default, this will be 'openapi/openapi.yaml' if the 'use-swaggerui' option is enabled. ",
    },
    overwrite: {
      type: "boolean",
      nullable: true,
      default: false,
      description:
        "When generating mock and project files, overwrite any existing files with the same name.",
    },
    "project-name": {
      type: "string",
      nullable: true,
      default: "ServiceProject",
      description: "The name of the generated project.",
    },
    "http-port": {
      type: "number",
      nullable: true,
      default: null,
      description: "The service http port when hosting the project locally.",
    },
    "https-port": {
      type: "number",
      nullable: true,
      default: null,
      description: "The service https port when hosting the project locally.",
    },
    "collection-type": {
      type: "string",
      enum: ["array", "enumerable"],
      nullable: true,
      default: "array",
      description:
        "Specifies the collection type to use: 'array' or 'enumerable'. The default is 'array'.",
    },
  },
  required: [],
};

/**
 * Library definition loaded by the TypeSpec compiler to validate C# server emitter
 * options and report emitter diagnostics. The testing entry point exposes this same definition.
 */
export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-server-csharp",
  capabilities: {
    dryRun: true,
  },
  diagnostics: {
    "invalid-identifier": {
      severity: "warning",
      messages: {
        default: paramMessage`Invalid identifier '${"identifier"}' in ${"location"}`,
      },
    },
    "anonymous-model": {
      severity: "warning",
      messages: {
        default: paramMessage`Inline models use generated names in emitted code. Consider defining each model with an explicit name.  This model will be named '${"emittedName"}' in emitted code`,
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
    "invalid-intrinsic": {
      severity: "error",
      messages: {
        default: paramMessage`Intrinsic type ${"typeName"} is not valid in this context.  Please use a model, enum, union, scalar, or the unknown type`,
      },
    },
    "invalid-interpolation": {
      severity: "warning",
      messages: {
        default: paramMessage`StringTemplate types should only reference literal-valued constants, enum members, or literal-valued model properties.  The interpolated value will not contain one or more referenced elements in generated code.`,
      },
    },
    "get-request-body": {
      severity: "warning",
      messages: {
        default: paramMessage`Get operations should not have request bodies. Generating an operation and interface without parameters, your business logic will use HttpContext to interpret Request properties.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<CSharpServiceEmitterOptions>,
  },
});

export const { reportDiagnostic, createStateSymbol, getTracer } = $lib;

export type CSharpServiceLibrary = typeof $lib;
