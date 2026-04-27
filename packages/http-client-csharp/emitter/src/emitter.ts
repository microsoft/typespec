// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { createSdkContext, SdkContext } from "@azure-tools/typespec-client-generator-core";
import { createDiagnosticCollector, Diagnostic, EmitContext, Program } from "@typespec/compiler";
import { resolve } from "path";
import { serializeCodeModel } from "./code-model-writer.js";
import { generate } from "./emit-generate.js";
import { createModel } from "./lib/client-model-builder.js";
import { LoggerLevel } from "./lib/logger-level.js";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions, resolveOptions } from "./options.js";
import { createCSharpEmitterContext, CSharpEmitterContext } from "./sdk-context.js";
import { CodeModel } from "./type/code-model.js";
import { Configuration } from "./type/configuration.js";

/**
 * Creates a code model by executing the full emission logic.
 * This function can be called by downstream emitters to generate a code model and collect diagnostics.
 *
 * @example
 * ```typescript
 * import { emitCodeModel } from "@typespec/http-client-csharp";
 *
 * export async function $onEmit(context: EmitContext<MyEmitterOptions>) {
 *   const updateCodeModel = (model: CodeModel, context: CSharpEmitterContext) => {
 *     // Customize the code model here
 *     return model;
 *   };
 *   const [, diagnostics] = await emitCodeModel(context, updateCodeModel);
 *   // Process diagnostics as needed
 *   context.program.reportDiagnostics(diagnostics);
 * }
 * ```
 *
 * @param context - The emit context
 * @param updateCodeModel - Optional callback to modify the code model before emission
 * @returns A tuple containing void and any diagnostics that were generated during the emission
 * @beta
 */
export async function emitCodeModel(
  context: EmitContext<CSharpEmitterOptions>,
  updateCodeModel?: (model: CodeModel, context: CSharpEmitterContext) => CodeModel,
): Promise<[void, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  const program: Program = context.program;
  const options = resolveOptions(context);
  const outputFolder = context.emitterOutputDir;

  // Resolve plugin paths to absolute if specified
  if (options["plugins"]) {
    options["plugins"] = options["plugins"].map((p) => resolve(outputFolder, p));
  }

  /* set the log level. */
  const logger = new Logger(program, options.logLevel ?? LoggerLevel.INFO);

  if (!program.compilerOptions.noEmit && !program.hasError()) {
    // Write out the dotnet model to the output path
    const sdkContext = createCSharpEmitterContext(
      await createSdkContext(
        context,
        "@typespec/http-client-csharp",
        options["sdk-context-options"],
      ),
      logger,
    );
    for (const diag of sdkContext.diagnostics) {
      diagnostics.add(diag);
    }

    const root = diagnostics.pipe(createModel(sdkContext));

    if (root) {
      // Apply optional code model update callback
      const updatedRoot = updateCodeModel ? updateCodeModel(root, sdkContext) : root;

      const namespace = updatedRoot.name;
      const configurations: Configuration = createConfiguration(options, namespace, sdkContext);

      // Serialize code model and configuration
      const codeModelJson = serializeCodeModel(sdkContext, updatedRoot);
      const configJson = JSON.stringify(configurations, null, 2) + "\n";

      // Generate C# code via platform-specific implementation.
      // In Node.js this runs the .NET generator locally.
      // In the browser this sends the code model to a playground server.
      await generate(sdkContext, codeModelJson, configJson, {
        outputFolder,
        packageName: configurations["package-name"] ?? "",
        generatorName: options["generator-name"],
        newProject: options["new-project"],
        debug: options.debug ?? false,
        saveInputs: options["save-inputs"] ?? false,
        emitterExtensionPath: options["emitter-extension-path"],
      });
    }
  }

  return diagnostics.wrap(undefined);
}

/**
 * The entry point for the emitter. This function is called by the typespec compiler.
 * @param context - The emit context
 * @beta
 */
export async function $onEmit(context: EmitContext<CSharpEmitterOptions>) {
  const [, diagnostics] = await emitCodeModel(context);
  context.program.reportDiagnostics(diagnostics);
}

export function createConfiguration(
  options: CSharpEmitterOptions,
  namespace: string,
  sdkContext: SdkContext,
): Configuration {
  const skipKeys = [
    "new-project",
    "sdk-context-options",
    "save-inputs",
    "generator-name",
    "debug",
    "logLevel",
    "generator-name",
    "api-version",
    "generate-protocol-methods",
    "generate-convenience-methods",
    "emitter-extension-path",
  ];
  const derivedOptions = Object.fromEntries(
    Object.entries(options).filter(([key]) => !skipKeys.includes(key)),
  );
  return {
    // spread custom options first so that the predefined options below can override them
    ...derivedOptions,
    "package-name": options["package-name"] ?? namespace,
    "unreferenced-types-handling": options["unreferenced-types-handling"],
    "disable-xml-docs":
      options["disable-xml-docs"] === false ? undefined : options["disable-xml-docs"],
    license: sdkContext.sdkPackage.licenseInfo,
  };
}
