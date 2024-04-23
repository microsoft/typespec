import { SdkEmitterOptions } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, JSONSchemaType, resolvePath } from "@typespec/compiler";
import { tspOutputFileName } from "./constants.js";
import { LoggerLevel } from "./lib/logger.js";

export type NetEmitterOptions = {
  outputFile?: string;
  logFile?: string;
  namespace: string;
  "library-name": string;
  "single-top-level-client"?: boolean;
  skipSDKGeneration?: boolean;
  "unreferenced-types-handling"?: "removeOrInternalize" | "internalize" | "keepAll";
  "new-project"?: boolean;
  csharpGeneratorPath?: string;
  "clear-output-folder"?: boolean;
  "save-inputs"?: boolean;
  "model-namespace"?: boolean;
  "existing-project-folder"?: string;
  "keep-non-overloadable-protocol-signature"?: boolean;
  debug?: boolean;
  "models-to-treat-empty-string-as-null"?: string[];
  "additional-intrinsic-types-to-treat-empty-string-as-null"?: string[];
  "methods-to-keep-client-default-value"?: string[];
  "deserialize-null-collection-as-null-value"?: boolean;
  logLevel?: string;
  "package-dir"?: string;
  "head-as-boolean"?: boolean;
  flavor?: string;
  "generate-sample-project"?: boolean;
  "generate-test-project"?: boolean;
  "use-model-reader-writer"?: boolean;
} & SdkEmitterOptions;

export const NetEmitterOptionsSchema: JSONSchemaType<NetEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    outputFile: { type: "string", nullable: true },
    logFile: { type: "string", nullable: true },
    namespace: { type: "string" },
    "library-name": { type: "string" },
    "single-top-level-client": { type: "boolean", nullable: true },
    skipSDKGeneration: { type: "boolean", default: false, nullable: true },
    "unreferenced-types-handling": {
      type: "string",
      enum: ["removeOrInternalize", "internalize", "keepAll"],
      nullable: true,
    },
    "new-project": { type: "boolean", nullable: true },
    csharpGeneratorPath: {
      type: "string",
      default: "fake-location",
      nullable: true,
    },
    "clear-output-folder": { type: "boolean", nullable: true },
    "save-inputs": { type: "boolean", nullable: true },
    "model-namespace": { type: "boolean", nullable: true },
    "generate-protocol-methods": { type: "boolean", nullable: true },
    "generate-convenience-methods": { type: "boolean", nullable: true },
    "filter-out-core-models": { type: "boolean", nullable: true },
    "package-name": { type: "string", nullable: true },
    "existing-project-folder": { type: "string", nullable: true },
    "keep-non-overloadable-protocol-signature": {
      type: "boolean",
      nullable: true,
    },
    debug: { type: "boolean", nullable: true },
    "models-to-treat-empty-string-as-null": {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    "additional-intrinsic-types-to-treat-empty-string-as-null": {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    "methods-to-keep-client-default-value": {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    "deserialize-null-collection-as-null-value": {
      type: "boolean",
      nullable: true,
    },
    logLevel: {
      type: "string",
      enum: [
        LoggerLevel.ERROR,
        LoggerLevel.WARN,
        LoggerLevel.INFO,
        LoggerLevel.DEBUG,
        LoggerLevel.VERBOSE,
      ],
      nullable: true,
    },
    "package-dir": { type: "string", nullable: true },
    "head-as-boolean": { type: "boolean", nullable: true },
    flavor: { type: "string", nullable: true },
    "generate-sample-project": {
      type: "boolean",
      nullable: true,
      default: true,
    },
    "generate-test-project": {
      type: "boolean",
      nullable: true,
      default: false,
    },
    "use-model-reader-writer": { type: "boolean", nullable: true },
  },
  required: [],
};

const defaultOptions = {
  outputFile: tspOutputFileName,
  logFile: "log.json",
  skipSDKGeneration: false,
  "new-project": false,
  csharpGeneratorPath: "fake-location",
  "clear-output-folder": false,
  "save-inputs": false,
  "generate-protocol-methods": true,
  "generate-convenience-methods": true,
  "package-name": undefined,
  debug: undefined,
  "models-to-treat-empty-string-as-null": undefined,
  "additional-intrinsic-types-to-treat-empty-string-as-null": [],
  "methods-to-keep-client-default-value": undefined,
  "deserialize-null-collection-as-null-value": undefined,
  logLevel: LoggerLevel.INFO,
  flavor: undefined,
  "generate-test-project": false,
};

export function resolveOptions(context: EmitContext<NetEmitterOptions>) {
  const emitterOptions = context.options;
  const emitterOutputDir = context.emitterOutputDir;
  const resolvedOptions = { ...defaultOptions, ...emitterOptions };

  const outputFolder = resolveOutputFolder(context);
  return {
    ...resolvedOptions,
    outputFile: resolvePath(outputFolder, resolvedOptions.outputFile),
    logFile: resolvePath(emitterOutputDir ?? "./tsp-output", resolvedOptions.logFile),
  };
}

export function resolveOutputFolder(context: EmitContext<NetEmitterOptions>): string {
  return resolvePath(context.emitterOutputDir ?? "./tsp-output");
}
