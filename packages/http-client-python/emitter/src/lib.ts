import {
  SdkContext,
  SdkEmitterOptions,
  SdkEmitterOptionsSchema,
  SdkServiceOperation,
} from "@azure-tools/typespec-client-generator-core";
import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface PythonEmitterOptions extends SdkEmitterOptions {
  /**
   * The version of the package.
   */
  "package-version"?: string;
  /**
   * The name of the package.
   */
  "package-name"?: string;
  /**
   * The output directory.
   */
  "output-dir"?: string;
  /**
   * Whether to generate packaging files. Packaging files refer to the setup.py,
   */
  "generate-packaging-files"?: boolean;
  /**
   * If you are using a custom packaging files directory, you can specify it here. We won't generate with the default packaging files we have.
   */
  "packaging-files-dir"?: string;
  /**
   * If you are using a custom packaging files directory, and have additional configuration parameters you want to pass in during generation, you can specify it here.
   */
  "packaging-files-config"?: object;
  /**
   * The name of the package to be used in pretty-printing. Will be the name of the package in README and pprinting of setup.py
   */
  "package-pprint-name"?: string;
  /**
   * Whether to return responses from HEAD requests as boolean. Defaults to `true`
   */
  "head-as-boolean"?: boolean;
  /**
   * What kind of models to generate. If you pass in `none`, we won't generate models. `dpg` models are the default models we generate.
   */
  "models-mode"?: string;
  /**
   * Whether to include distributed tracing in the generated code. Defaults to `true`.
   */
  tracing?: boolean;
  /**
   * The name of the company. This will be reflected in your license files and documentation
   */
  "company-name"?: string;
  /**
   * Whether to generate test files, for basic testing of your generated sdks. Defaults to `false`.
   */
  "generate-test"?: boolean;
  /**
   * Run the emitter in debug mode.
   */
  debug?: boolean;
  flavor?: "azure";
  /**
   * The directory where examples are stored.
   */
  "examples-dir"?: string;
  /**
   * Whether the generated package namespace will respec the typespec namespace. Defaults to `true`, which is the suggested value. Use `false` to continue with legacy handling of namespace following `package-name`
   */
  "enable-typespec-namespace"?: boolean;
  /**
   * Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.
   */
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
    ...SdkEmitterOptionsSchema.properties,
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
export const { reportDiagnostic, createDiagnostic } = $lib;
