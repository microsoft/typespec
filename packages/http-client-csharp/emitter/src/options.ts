import { SdkEmitterOptions } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, JSONSchemaType, resolvePath } from "@typespec/compiler";
import { _defaultGeneratorName, tspOutputFileName } from "./constants.js";
import { LoggerLevel } from "./lib/logger-level.js";
import { CodeModel } from "./type/code-model.js";

/**
 * The emitter options for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterOptions extends SdkEmitterOptions {
  "api-version"?: string;
  outputFile?: string;
  logFile?: string;
  "unreferenced-types-handling"?: "removeOrInternalize" | "internalize" | "keepAll";
  "new-project"?: boolean;
  "clear-output-folder"?: boolean;
  "save-inputs"?: boolean;
  debug?: boolean;
  logLevel?: LoggerLevel;
  "disable-xml-docs"?: boolean;
  "generator-name"?: string;
  "emitter-extension-path"?: string;
  "update-code-model"?: (model: CodeModel) => CodeModel;
}

/**
 * The JSON schema for the CSharp emitter options.
 * @beta
 */
export const CSharpEmitterOptionsSchema: JSONSchemaType<CSharpEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "emitter-name": { type: "string", nullable: true },
    "examples-directory": { type: "string", nullable: true },
    "examples-dir": { type: "string", nullable: true },
    "api-version": { type: "string", nullable: true },
    outputFile: { type: "string", nullable: true },
    logFile: { type: "string", nullable: true },
    "unreferenced-types-handling": {
      type: "string",
      enum: ["removeOrInternalize", "internalize", "keepAll"],
      nullable: true,
    },
    "new-project": { type: "boolean", nullable: true },
    "clear-output-folder": { type: "boolean", nullable: true },
    "save-inputs": { type: "boolean", nullable: true },
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
    "generator-name": { type: "string", nullable: true },
    "emitter-extension-path": { type: "string", nullable: true },
    "update-code-model": { type: "object", nullable: true },
  },
  required: [],
};

/**
 * The default options for the CSharp emitter.
 * @beta
 */
export const defaultOptions = {
  "api-version": "latest",
  outputFile: tspOutputFileName,
  logFile: "log.json",
  "new-project": false,
  "clear-output-folder": false,
  "save-inputs": false,
  "generate-protocol-methods": true,
  "generate-convenience-methods": true,
  "package-name": undefined,
  debug: undefined,
  logLevel: LoggerLevel.INFO,
  "generator-name": _defaultGeneratorName,
  "emitter-extension-path": undefined,
  "update-code-model": (model: CodeModel) => model,
};

/**
 * Resolves the options for the CSharp emitter.
 * @param context - The emit context.
 * @returns The resolved options.
 * @beta
 */
export function resolveOptions(context: EmitContext<CSharpEmitterOptions>) {
  const emitterOptions = context.options;
  const emitterOutputDir = context.emitterOutputDir;
  const resolvedOptions = { ...defaultOptions, ...emitterOptions };

  const outputFolder = _resolveOutputFolder(context);
  return {
    ...resolvedOptions,
    outputFile: resolvePath(outputFolder, resolvedOptions.outputFile),
    logFile: resolvePath(emitterOutputDir ?? "./tsp-output", resolvedOptions.logFile),
  };
}

/**
 * Resolves the output folder for the CSharp emitter.
 * @param context - The emit context.
 * @returns The resolved output folder path.
 * @internal
 */
export function _resolveOutputFolder(context: EmitContext<CSharpEmitterOptions>): string {
  return resolvePath(context.emitterOutputDir ?? "./tsp-output");
}
