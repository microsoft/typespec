import { SdkEmitterOptions } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, JSONSchemaType, resolvePath } from "@typespec/compiler";
import { tspOutputFileName } from "./constants.js";
import { LoggerLevel } from "./lib/log-level.js";

export interface NetEmitterOptions extends SdkEmitterOptions {
  "api-version"?: string;
  outputFile?: string;
  logFile?: string;
  namespace: string;
  "library-name": string;
  skipSDKGeneration?: boolean;
  "unreferenced-types-handling"?: "removeOrInternalize" | "internalize" | "keepAll";
  "new-project"?: boolean;
  "clear-output-folder"?: boolean;
  "save-inputs"?: boolean;
  "model-namespace"?: boolean;
  debug?: boolean;
  logLevel?: LoggerLevel;
  "disable-xml-docs"?: boolean;
  "plugin-name"?: string;
  "emitter-extension-path"?: string;
}

export const NetEmitterOptionsSchema: JSONSchemaType<NetEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "emitter-name": { type: "string", nullable: true },
    "examples-directory": { type: "string", nullable: true },
    "examples-dir": { type: "string", nullable: true },
    "api-version": { type: "string", nullable: true },
    outputFile: { type: "string", nullable: true },
    logFile: { type: "string", nullable: true },
    namespace: { type: "string" },
    "library-name": { type: "string" },
    skipSDKGeneration: { type: "boolean", default: false, nullable: true },
    "unreferenced-types-handling": {
      type: "string",
      enum: ["removeOrInternalize", "internalize", "keepAll"],
      nullable: true,
    },
    "new-project": { type: "boolean", nullable: true },
    "clear-output-folder": { type: "boolean", nullable: true },
    "save-inputs": { type: "boolean", nullable: true },
    "model-namespace": { type: "boolean", nullable: true },
    "generate-protocol-methods": { type: "boolean", nullable: true },
    "generate-convenience-methods": { type: "boolean", nullable: true },
    "flatten-union-as-enum": { type: "boolean", nullable: true },
    "package-name": { type: "string", nullable: true },
    debug: { type: "boolean", nullable: true },
    logLevel: {
      type: "string",
      enum: [LoggerLevel.INFO, LoggerLevel.DEBUG, LoggerLevel.VERBOSE],
      nullable: true,
    },
    "disable-xml-docs": { type: "boolean", nullable: true },
    "plugin-name": { type: "string", nullable: true },
    "emitter-extension-path": { type: "string", nullable: true },
  },
  required: [],
};

export const defaultOptions = {
  "api-version": "latest",
  outputFile: tspOutputFileName,
  logFile: "log.json",
  skipSDKGeneration: false,
  "new-project": false,
  "clear-output-folder": false,
  "save-inputs": false,
  "generate-protocol-methods": true,
  "generate-convenience-methods": true,
  "package-name": undefined,
  debug: undefined,
  logLevel: LoggerLevel.INFO,
  "plugin-name": "ClientModelPlugin",
  "emitter-extension-path": undefined,
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
