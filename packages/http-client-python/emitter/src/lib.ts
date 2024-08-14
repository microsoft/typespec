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
    /**
     * The version of the package
     * @default "1.0.0b1"
     */
    "package-version": { type: "string", nullable: true },
    /**
     * Name of the generated package
     * @default namespace of the service
     */
    "package-name": { type: "string", nullable: true },
    /**
     * Output directory for the generated code
     */
    "output-dir": { type: "string", nullable: true },
    /**
     * Whether to generate missing packaging files, i.e. README and setup.py
     * @default true
     */
    "generate-packaging-files": { type: "boolean", nullable: true },
    /**
     * If there are packaging file templates you'd like us to use to generate packaging information, pass path here
     * @default null
     */
    "packaging-files-dir": { type: "string", nullable: true },
    /**
     * Specify configuration options that will be passed directly into the packaging files specified by the `packaging-files-dir` option.
     * @default null
     */
    "packaging-files-config": { type: "object", nullable: true },
    /**
     * Specify the pretty print name for the package.
     * @default `package-name`
     */
    "package-pprint-name": { type: "string", nullable: true },
    /**
     * Whether to generate responses from head calls as booleans
     * @default true
     */
    "head-as-boolean": { type: "boolean", nullable: true },
    /**
     * What type of models you want generated. Options are `dpg` or `none`
     * @default "dpg"
     */
    "models-mode": { type: "string", nullable: true },
    /**
     * Whether to include tracing in the generated code
     * @default true
     */
    tracing: { type: "boolean", nullable: true },
    /**
     * The company name to use in the generated code
     * @default for `flavor=azure` it will be `Microsoft`, otherwise null
     */
    "company-name": { type: "string", nullable: true },
    /**
     * Generate test code infrastructure when generating sdk
     * @default false
     */
    "generate-test": { type: "boolean", nullable: true },
    /**
     * Whether to debug and step through generation
     * @default false
     */
    debug: { type: "boolean", nullable: true },
    /**
     * The flavor of the generated code. Only valid values are `azure` and `null`. Pass in `azure` if you are generating an Azure service and want your SDK to fulfill Azure guidelines.
     * @default null
     */
    flavor: { type: "string", nullable: true },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-python",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<PythonEmitterOptions>,
  },
});
export const { reportDiagnostic, createStateSymbol, getTracer } = $lib;
