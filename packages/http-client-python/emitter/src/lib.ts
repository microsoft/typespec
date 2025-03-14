import { SdkContext, SdkServiceOperation } from "@azure-tools/typespec-client-generator-core";
import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface PythonEmitterOptions {
  "package-version"?: string;
  "package-name"?: string;
  "output-dir"?: string;
  "generate-packaging-files"?: boolean;
  "packaging-files-dir"?: string;
  "packaging-files-config"?: object;
  "package-pprint-name"?: string;
  "head-as-boolean"?: boolean;
  "models-mode"?: string;
  tracing?: boolean;
  "company-name"?: string;
  "generate-test"?: boolean;
  debug?: boolean;
  flavor?: "azure";
  "examples-dir"?: string;
  // If true, package namespace will respect the typespec namespace. Otherwise,
  // package namespace is always aligned with package name.
  "enable-typespec-namespace"?: boolean;
  "use-pyodide"?: boolean;
}

export interface PythonSdkContext<TServiceOperation extends SdkServiceOperation>
  extends SdkContext<PythonEmitterOptions, TServiceOperation> {
  __endpointPathParameters: Record<string, any>[];
}

const EmitterOptionsSchema: JSONSchemaType<PythonEmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "package-version": { type: "string", nullable: true },
    "package-name": { type: "string", nullable: true },
    "output-dir": { type: "string", nullable: true },
    "generate-packaging-files": { type: "boolean", nullable: true },
    "packaging-files-dir": { type: "string", nullable: true },
    "packaging-files-config": { type: "object", nullable: true },
    "package-pprint-name": { type: "string", nullable: true },
    "head-as-boolean": { type: "boolean", nullable: true },
    "models-mode": { type: "string", nullable: true },
    tracing: { type: "boolean", nullable: true },
    "company-name": { type: "string", nullable: true },
    "generate-test": { type: "boolean", nullable: true },
    debug: { type: "boolean", nullable: true },
    flavor: { type: "string", nullable: true },
    "examples-dir": { type: "string", nullable: true, format: "absolute-path" },
    "enable-typespec-namespace": { type: "boolean", nullable: true },
    "use-pyodide": { type: "boolean", nullable: true },
  },
  required: [],
};

const libDef = {
  name: "@typespec/http-client-python",
  diagnostics: {
    // error
    "unknown-error": {
      severity: "error",
      messages: {
        default: paramMessage`Can't generate Python client code from this TypeSpec. Please open an issue on https://github.com/microsoft/typespec'.${"stack"}`,
      },
    },
    "invalid-models-mode": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid value '${"inValidValue"}' for 'models-mode' of tspconfig.yaml and expected values are 'dpg'/'none'.`,
      },
    },
    "pyodide-flag-conflict": {
      severity: "error",
      messages: {
        default:
          "Python is not installed. Please follow https://www.python.org/ to install Python or set 'use-pyodide' to true.",
      },
    },
    // warning
    "no-valid-client": {
      severity: "warning",
      messages: {
        default: "Can't generate Python SDK since no client defined in typespec file.",
      },
    },
    "invalid-paging-items": {
      severity: "warning",
      messages: {
        default: paramMessage`No valid paging items for operation '${"operationId"}'.`,
      },
    },
    "invalid-next-link": {
      severity: "warning",
      messages: {
        default: paramMessage`No valid next link for operation '${"operationId"}'.`,
      },
    },
    "invalid-lro-result": {
      severity: "warning",
      messages: {
        default: paramMessage`No valid LRO result for operation '${"operationId"}'.`,
      },
    },
    "invalid-continuation-token": {
      severity: "warning",
      messages: {
        default: paramMessage`No valid continuation token in '${"direction"}' for operation '${"operationId"}'.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<PythonEmitterOptions>,
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createStateSymbol, getTracer } = $lib;
