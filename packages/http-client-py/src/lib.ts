import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

export type Flavor = "unbranded" | "azure";

/**
 * Strategy for post-processing the emitted Python.
 *
 * - `"pyodide"` — load Pyodide and run `black` over the emitted output,
 *   plus inject pylint disable headers for files that exceed pylint defaults.
 *   This matches the behavior of `@typespec/http-client-python`.
 * - `"none"` — write the alloy-rendered output as-is. Useful in fast
 *   incremental workflows and tests.
 */
export type PostProcess = "pyodide" | "none";

export interface PyClientEmitterOptions {
  "package-name"?: string;
  "package-version"?: string;
  flavor?: Flavor;
  "generate-sync"?: boolean;
  "generate-async"?: boolean;
  "post-process"?: PostProcess;
}

const EmitterOptionsSchema: JSONSchemaType<PyClientEmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "package-name": {
      type: "string",
      nullable: true,
      default: "test-package",
      description: "Name of the package as it will appear in pyproject.toml",
    },
    "package-version": {
      type: "string",
      nullable: true,
      default: "1.0.0",
      description: "Version of the package as it will appear in pyproject.toml",
    },
    flavor: {
      type: "string",
      enum: ["unbranded", "azure"],
      nullable: true,
      default: "unbranded",
      description:
        "Runtime flavor for generated code. 'unbranded' targets corehttp; 'azure' targets azure.core.",
    },
    "generate-sync": {
      type: "boolean",
      nullable: true,
      default: true,
      description: "Whether to emit a synchronous client.",
    },
    "generate-async": {
      type: "boolean",
      nullable: true,
      default: true,
      description: "Whether to emit an asynchronous client (under aio/).",
    },
    "post-process": {
      type: "string",
      enum: ["pyodide", "none"],
      nullable: true,
      default: "pyodide",
      description:
        "Post-process the emitted Python with Pyodide-hosted black + pylint header injection. Defaults to 'pyodide' for shippable, idiomatically-formatted output (matching `@typespec/http-client-python`); set to 'none' to skip pyodide and emit raw alloy output (useful for fast incremental development).",
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-py",
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
    "operation-not-in-client": {
      severity: "error",
      messages: {
        default: "Tried to get a client from an operation that is not in a client",
      },
    },
    "multiple-auth-schemes-not-yet-supported": {
      severity: "warning",
      messages: {
        default: "Multiple authentication schemes are not yet supported",
      },
      description:
        "Multiple authentication schemes are not yet supported. Falling back to the first one.",
    },
    "unsupported-content-type": {
      severity: "warning",
      messages: {
        default: "Unsupported content type. Falling back to json",
      },
    },
    "symbol-name-not-supported": {
      severity: "error",
      messages: {
        default: "The transform namer doesn't support symbol names",
      },
    },
    "no-name-type": {
      severity: "warning",
      messages: {
        default: "Trying to get a name from a type that doesn't have a name",
      },
    },
    "client-not-found": {
      severity: "error",
      messages: {
        default: "Client for operation not found",
      },
    },
    "unsupported-type": {
      severity: "warning",
      messages: {
        default: "Unsupported type encountered while emitting Python; rendering as Any",
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
