import { SdkContext, SdkServiceOperation } from "@azure-tools/typespec-client-generator-core";
import { JSONSchemaType, createTypeSpecLibrary } from "@typespec/compiler";

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
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@azure-tools/typespec-python",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<PythonEmitterOptions>,
  },
});
export const { reportDiagnostic, createStateSymbol, getTracer } = $lib;
