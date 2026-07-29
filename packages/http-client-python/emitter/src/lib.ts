import {
  SdkContext,
  SdkType,
  UnbrandedSdkEmitterOptions,
} from "@azure-tools/typespec-client-generator-core";
import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface PythonEmitterOptions {
  "api-version"?: string;
  license?: {
    name: string;
    company?: string;
    link?: string;
    header?: string;
    description?: string;
  };

  "package-version"?: string;
  "package-name"?: string;
  "generate-packaging-files"?: boolean;
  "packaging-files-dir"?: string;
  "packaging-files-config"?: object;
  "package-pprint-name"?: string;
  "head-as-boolean"?: boolean;
  "use-pyodide"?: boolean;
  "keep-setup-py"?: boolean;
  "keep-pyproject-fields"?: {
    authors?: boolean;
    description?: boolean;
    classifiers?: boolean;
    urls?: boolean;
  };
  "clear-output-folder"?: boolean;
  "emit-yaml-only"?: boolean;
}

export interface PythonSdkContext extends SdkContext<PythonEmitterOptions> {
  __endpointPathParameters: Record<string, any>[];
  __typesMap: Map<SdkType, Record<string, any>>;
  __simpleTypesMap: Map<string | null, Record<string, any>>;
  __disableGenerationMap: Set<SdkType>;
}

export const PythonEmitterOptionsSchema: JSONSchemaType<PythonEmitterOptions> = {
  type: "object",
  additionalProperties: true, // since we test azure with unbranded emitter, we need to allow additional properties
  properties: {
    ...UnbrandedSdkEmitterOptions["api-version"],
    ...UnbrandedSdkEmitterOptions["license"],

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
    "use-pyodide": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.",
    },
    "validate-versioning": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to validate the versioning of the package. Defaults to `true`. If set to `false`, we will not validate the versioning of the package.",
    },
    "generation-subdir": {
      type: "string",
      nullable: true,
      description:
        'The subdirectory (relative to the package namespace folder) to generate the code in. Use this to keep emitter-generated code separate from hand-written/customized code, so regeneration only overwrites the subdirectory and leaves your customizations untouched. If not specified, the code is generated directly in the package namespace folder. Note: if you\'re using this flag, you will need to add and maintain the versioning file (`_version.py`) yourself.\n\nExample: for `namespace: azure.storage.blob` with `generation-subdir: _generated`, generated code lands in `azure/storage/blob/_generated/` while your customized code lives in `azure/storage/blob/`. A typical `tspconfig.yaml` looks like:\n\n```yaml\noptions:\n  "@azure-tools/typespec-python":\n    emitter-output-dir: "{output-dir}/{service-dir}/azure-storage-blob"\n    namespace: "azure.storage.blob"\n    generation-subdir: "_generated"\n```',
    },
    "keep-setup-py": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to keep the existing `setup.py` when `generate-packaging-files` is `true`. If set to `false` and by default, `pyproject.toml` will be generated instead. To generate `setup.py`, use `basic-setup-py`.",
    },
    "keep-pyproject-fields": {
      type: "object",
      nullable: true,
      description:
        "Which manually customized `[project]` fields to preserve in an existing `pyproject.toml` instead of overwriting them on regeneration. Set a field to `true` to keep it. By default no fields are preserved.",
      properties: {
        authors: {
          type: "boolean",
          nullable: true,
          description: "Preserve the `authors` field (e.g. a custom author name and email).",
        },
        description: {
          type: "boolean",
          nullable: true,
          description: "Preserve the `description` field.",
        },
        classifiers: {
          type: "boolean",
          nullable: true,
          description: "Preserve the `classifiers` field.",
        },
        urls: {
          type: "boolean",
          nullable: true,
          description: "Preserve the `[project.urls]` table.",
        },
      },
      required: [],
      additionalProperties: false,
    },
    "clear-output-folder": {
      type: "boolean",
      nullable: true,
      description:
        "Whether to clear the output folder before generating the code. Defaults to `false`.",
    },
    "emit-yaml-only": {
      type: "boolean",
      nullable: true,
      description:
        "Emit YAML code model only, without running Python generator. For batch processing.",
    },
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
    "no-sdk-clients": {
      severity: "error",
      messages: {
        default:
          "The Python emitter did not find any SDK clients in this TypeSpec program. The current Python generator expects at least one client/service to generate code.",
      },
    },
    "browser-runtime-load-failed": {
      severity: "error",
      messages: {
        default: paramMessage`Failed to initialize the browser Python runtime.${"details"}`,
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
    options: PythonEmitterOptionsSchema,
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic, createDiagnostic } = $lib;
