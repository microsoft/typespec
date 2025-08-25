// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { createSdkContext, SdkContext } from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  getDirectoryPath,
  joinPaths,
  NoTarget,
  Program,
  resolvePath,
} from "@typespec/compiler";
import fs, { statSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { writeCodeModel, writeConfiguration } from "./code-model-writer.js";
import {
  _minSupportedDotNetSdkVersion,
  configurationFileName,
  tspOutputFileName,
} from "./constants.js";
import { createModel } from "./lib/client-model-builder.js";
import { LoggerLevel } from "./lib/logger-level.js";
import { Logger } from "./lib/logger.js";
import { execAsync, execCSharpGenerator } from "./lib/utils.js";
import { CSharpEmitterOptions, resolveOptions } from "./options.js";
import { createCSharpEmitterContext, CSharpEmitterContext } from "./sdk-context.js";
import { Configuration } from "./type/configuration.js";

/**
 * Look for the project root by looking up until a `package.json` is found.
 * @param path Path to start looking
 */
function findProjectRoot(path: string): string | undefined {
  let current = path;
  while (true) {
    const pkgPath = joinPaths(current, "package.json");
    const stats = checkFile(pkgPath);
    if (stats?.isFile()) {
      return current;
    }
    const parent = getDirectoryPath(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

/**
 * The entry point for the emitter. This function is called by the typespec compiler.
 * @param context - The emit context
 * @beta
 */
export async function $onEmit(context: EmitContext<CSharpEmitterOptions>) {
  const program: Program = context.program;
  const options = resolveOptions(context);
  const outputFolder = context.emitterOutputDir;

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
    program.reportDiagnostics(sdkContext.diagnostics);

    let root = createModel(sdkContext);

    if (root) {
      root = options["update-code-model"](root, sdkContext);
      const generatedFolder = resolvePath(outputFolder, "src", "Generated");

      if (!fs.existsSync(generatedFolder)) {
        fs.mkdirSync(generatedFolder, { recursive: true });
      }

      // emit tspCodeModel.json
      await writeCodeModel(sdkContext, root, outputFolder);

      const namespace = root.name;
      const configurations: Configuration = createConfiguration(options, namespace, sdkContext);

      //emit configuration.json
      await writeConfiguration(sdkContext, configurations, outputFolder);

      const csProjFile = resolvePath(
        outputFolder,
        "src",
        `${configurations["package-name"]}.csproj`,
      );
      logger.info(`Checking if ${csProjFile} exists`);

      const emitterPath = options["emitter-extension-path"] ?? import.meta.url;
      const projectRoot = findProjectRoot(dirname(fileURLToPath(emitterPath)));
      const generatorPath = resolvePath(
        projectRoot + "/dist/generator/Microsoft.TypeSpec.Generator.dll",
      );

      try {
        const result = await execCSharpGenerator(sdkContext, {
          generatorPath: generatorPath,
          outputFolder: outputFolder,
          generatorName: options["generator-name"],
          newProject: options["new-project"] || !checkFile(csProjFile),
          debug: options.debug ?? false,
        });
        if (result.exitCode !== 0) {
          const isValid = await _validateDotNetSdk(sdkContext, _minSupportedDotNetSdkVersion);
          // if the dotnet sdk is valid, the error is not dependency issue, log it as normal
          if (isValid) {
            throw new Error(
              `Failed to generate the library. Exit code: ${result.exitCode}.\nStackTrace: \n${result.stderr}`,
            );
          }
        }
      } catch (error: any) {
        const isValid = await _validateDotNetSdk(sdkContext, _minSupportedDotNetSdkVersion);
        // if the dotnet sdk is valid, the error is not dependency issue, log it as normal
        if (isValid) throw new Error(error);
      }
      if (!options["save-inputs"]) {
        // delete
        context.program.host.rm(resolvePath(outputFolder, tspOutputFileName));
        context.program.host.rm(resolvePath(outputFolder, configurationFileName));
      }
    }
  }
}

export function createConfiguration(
  options: CSharpEmitterOptions,
  namespace: string,
  sdkContext: SdkContext,
): Configuration {
  const skipKeys = [
    "new-project",
    "update-code-model",
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

/** check the dotnet sdk installation.
 * Report diagnostic if dotnet sdk is not installed or its version does not meet prerequisite
 * @param sdkContext - The SDK context
 * @param minVersionRequisite - The minimum required major version
 * @param logger - The logger
 * @internal
 */
export async function _validateDotNetSdk(
  sdkContext: CSharpEmitterContext,
  minMajorVersion: number,
): Promise<boolean> {
  try {
    const result = await execAsync("dotnet", ["--version"], { stdio: "pipe" });
    return validateDotNetSdkVersionCore(sdkContext, result.stdout, minMajorVersion);
  } catch (error: any) {
    if (error && "code" in error && error["code"] === "ENOENT") {
      sdkContext.logger.reportDiagnostic({
        code: "invalid-dotnet-sdk-dependency",
        messageId: "missing",
        format: {
          dotnetMajorVersion: `${minMajorVersion}`,
          downloadUrl: "https://dotnet.microsoft.com/",
        },
        target: NoTarget,
      });
    }
    return false;
  }
}

function validateDotNetSdkVersionCore(
  sdkContext: CSharpEmitterContext,
  version: string,
  minMajorVersion: number,
): boolean {
  if (version) {
    const dotIndex = version.indexOf(".");
    const firstPart = dotIndex === -1 ? version : version.substring(0, dotIndex);
    const major = Number(firstPart);

    if (isNaN(major)) {
      return false;
    }
    if (major < minMajorVersion) {
      sdkContext.logger.reportDiagnostic({
        code: "invalid-dotnet-sdk-dependency",
        messageId: "invalidVersion",
        format: {
          installedVersion: version,
          dotnetMajorVersion: `${minMajorVersion}`,
          downloadUrl: "https://dotnet.microsoft.com/",
        },
        target: NoTarget,
      });
      return false;
    }
    return true;
  } else {
    sdkContext.logger.error("Cannot get the installed .NET SDK version.");
    return false;
  }
}

function checkFile(pkgPath: string) {
  try {
    return statSync(pkgPath);
  } catch (error) {
    return undefined;
  }
}
