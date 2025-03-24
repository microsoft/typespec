import {
  SdkContext,
  SdkEmitterOptions,
  SdkEmitterOptionsSchema,
} from "@azure-tools/typespec-client-generator-core";
import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface PythonEmitterOptions extends SdkEmitterOptions {
  "package-version"?: string;
  "package-name"?: string;
  "generate-packaging-files"?: boolean;
  "packaging-files-dir"?: string;
  "packaging-files-config"?: object;
  "package-pprint-name"?: string;
  "head-as-boolean"?: boolean;
  "models-mode"?: string;
  "company-name"?: string;
  "generate-test"?: boolean;
  flavor?: "azure";
  "use-pyodide"?: boolean;
}

export interface PythonSdkContext extends SdkContext<PythonEmitterOptions> {
  __endpointPathParameters: Record<string, any>[];
}

export const PythonEmitterOptionsSchema: JSONSchemaType<PythonEmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "package-version": {
      type: "string",
      nullable: true,
      description: "The version of the package.",
    },
    "package-name": {
      type: "string",
      nullable: true,
      description: "The name of the package.",
    },
    "generate-packaging-files": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to generate packaging files. Packaging files refer to the `setup.py`, `README`, and other files that are needed to package your code.",
    },
    "packaging-files-dir": {
      type: "string",
      nullable: true,
      description:
        "If you are using a custom packaging files directory, you can specify it here. We won't generate with the default packaging files we have.",
    },
    "packaging-files-config": {
      type: "object",
      nullable: true,
      description:
        "If you are using a custom packaging files directory, and have additional configuration parameters you want to pass in during generation, you can specify it here. Only applicable if `packaging-files-dir` is set.",
    },
    "package-pprint-name": {
      type: "string",
      nullable: true,
      description:
        "The name of the package to be used in pretty-printing. Will be the name of the package in `README` and pprinting of `setup.py`.",
    },
    "head-as-boolean": {
      type: "boolean",
      nullable: true,
      description: "Whether to return responses from HEAD requests as boolean. Defaults to `true`.",
    },
    "models-mode": {
      type: "string",
      nullable: true,
      enum: ["dpg", "none"],
      description:
        "What kind of models to generate. If you pass in `none`, we won't generate models. `dpg` models are the default models we generate.",
    },
    "company-name": {
      type: "string",
      nullable: true,
      description:
        "The name of the company. This will be reflected in your license files and documentation.",
    },
    "use-pyodide": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.",
    },
    "generate-test": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to generate test files, for basic testing of your generated sdks. Defaults to `false`.",
    },
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
    "pyodide-flag-conflict": {
      severity: "error",
      messages: {
        default:
          "Python is not installed. Please follow https://www.python.org/ to install Python or set 'use-pyodide' to true.",
      },
    },
    // warning
    "no-package-name": {
      severity: "warning",
      messages: {
        default: paramMessage`No package-name configured in tspconfig.yaml and will infer package-name '${"packageName"}' from namespace '${"namespace"}'.`,
      },
    },
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
    options: PythonEmitterOptionsSchema as JSONSchemaType<PythonEmitterOptions>,
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createDiagnostic } = $lib;
