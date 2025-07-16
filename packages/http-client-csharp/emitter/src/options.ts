import { CreateSdkContextOptions } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, JSONSchemaType } from "@typespec/compiler";
import { _defaultGeneratorName } from "./constants.js";
import { CSharpEmitterContext } from "./index.js";
import { LoggerLevel } from "./lib/logger-level.js";
import { CodeModel } from "./type/code-model.js";

/**
 * The emitter options for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterOptions {
  "api-version"?: string;
  "unreferenced-types-handling"?: "removeOrInternalize" | "internalize" | "keepAll";
  "new-project"?: boolean;
  "save-inputs"?: boolean;
  debug?: boolean;
  logLevel?: LoggerLevel;
  "disable-xml-docs"?: boolean;
  "generator-name"?: string;
  "emitter-extension-path"?: string;
  "update-code-model"?: (model: CodeModel, context: CSharpEmitterContext) => CodeModel;
  "sdk-context-options"?: CreateSdkContextOptions;
  "generate-protocol-methods"?: boolean;
  "generate-convenience-methods"?: boolean;
  "package-name"?: string;
  license?: {
    name: string;
    company?: string;
    link?: string;
    header?: string;
    description?: string;
  };
}

/**
 * The JSON schema for the CSharp emitter options.
 * @beta
 */
export const CSharpEmitterOptionsSchema: JSONSchemaType<CSharpEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "api-version": {
      type: "string",
      nullable: true,
      description:
        "For TypeSpec files using the [`@versioned`](https://typespec.io/docs/libraries/versioning/reference/decorators/#@TypeSpec.Versioning.versioned) decorator, " +
        "set this option to the version that should be used to generate against.",
    },
    "generate-protocol-methods": {
      type: "boolean",
      nullable: true,
      description:
        "Set to `false` to skip generation of protocol methods. The default value is `true`.",
    },
    "generate-convenience-methods": {
      type: "boolean",
      nullable: true,
      description:
        "Set to `false` to skip generation of convenience methods. The default value is `true`.",
    },
    "unreferenced-types-handling": {
      type: "string",
      enum: ["removeOrInternalize", "internalize", "keepAll"],
      nullable: true,
      description:
        "Defines the strategy on how to handle unreferenced types. The default value is `removeOrInternalize`.",
    },
    "new-project": {
      type: "boolean",
      nullable: true,
      description:
        "Set to `true` to overwrite the csproj if it already exists. The default value is `false`.",
    },
    "save-inputs": {
      type: "boolean",
      nullable: true,
      description:
        "Set to `true` to save the `tspCodeModel.json` and `Configuration.json` files that are emitted and used as inputs to the generator. The default value is `false`.",
    },
    "package-name": {
      type: "string",
      nullable: true,
      description:
        "Define the package name. If not specified, the first namespace defined in the TypeSpec is used as the package name.",
    },
    debug: {
      type: "boolean",
      nullable: true,
      description:
        "Set to `true` to automatically attempt to attach to a debugger when executing the C# generator. The default value is `false`.",
    },
    logLevel: {
      type: "string",
      enum: [LoggerLevel.INFO, LoggerLevel.DEBUG, LoggerLevel.VERBOSE],
      nullable: true,
      description: "Set the log level for which to collect traces. The default value is `info`.",
    },
    "disable-xml-docs": {
      type: "boolean",
      nullable: true,
      description:
        "Set to `true` to disable XML documentation generation. The default value is `false`.",
    },
    "generator-name": {
      type: "string",
      nullable: true,
      description:
        "The name of the generator. By default this is set to `ScmCodeModelGenerator`. Generator authors can set this to the name of a generator that inherits from `ScmCodeModelGenerator`.",
    },
    "emitter-extension-path": {
      type: "string",
      nullable: true,
      description:
        "Allows emitter authors to specify the path to a custom emitter package, allowing you to extend the emitter behavior. This should be set to `import.meta.url` if you are using a custom emitter.",
    },
    "update-code-model": {
      type: "object",
      nullable: true,
      description:
        "Allows emitter authors to specify a custom function to modify the generated code model before emitting. This is useful for modifying the code model before it is passed to the generator.",
    },
    license: {
      type: "object",
      additionalProperties: false,
      nullable: true,
      required: ["name"],
      properties: {
        name: { type: "string", nullable: false },
        company: { type: "string", nullable: true },
        link: { type: "string", nullable: true },
        header: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
      },
      description: "License information for the generated client code.",
    },
    "sdk-context-options": {
      type: "object",
      nullable: true,
      description:
        "The SDK context options that implement the `CreateSdkContextOptions` interface from the [`@azure-tools/typespec-client-generator-core`](https://www.npmjs.com/package/@azure-tools/typespec-client-generator-core) package to be used by the CSharp emitter.",
    },
  },
  required: [],
};

/**
 * The default options for the CSharp emitter.
 * @beta
 */
export const defaultOptions = {
  "api-version": "latest",
  "new-project": false,
  "save-inputs": false,
  "generate-protocol-methods": true,
  "generate-convenience-methods": true,
  "package-name": undefined,
  debug: undefined,
  logLevel: LoggerLevel.INFO,
  "generator-name": _defaultGeneratorName,
  "update-code-model": (model: CodeModel, context: CSharpEmitterContext) => model,
  "sdk-context-options": undefined,
};

/**
 * Resolves the options for the CSharp emitter.
 * @param context - The emit context.
 * @returns The resolved options.
 * @beta
 */
export function resolveOptions(context: EmitContext<CSharpEmitterOptions>) {
  const emitterOptions = context.options;
  const resolvedOptions = { ...defaultOptions, ...emitterOptions };

  return {
    ...resolvedOptions,
  };
}
