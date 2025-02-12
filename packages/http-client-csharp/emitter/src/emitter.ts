// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  createSdkContext,
  SdkContext,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  getDirectoryPath,
  joinPaths,
  logDiagnostics,
  NoTarget,
  Program,
  resolvePath,
} from "@typespec/compiler";

import fs, { statSync } from "fs";
import { PreserveType, stringifyRefs } from "json-serialize-refs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  _minSupportedDotNetSdkVersion,
  configurationFileName,
  tspOutputFileName,
} from "./constants.js";
import { createModel } from "./lib/client-model-builder.js";
import { reportDiagnostic } from "./lib/lib.js";
import { LoggerLevel } from "./lib/log-level.js";
import { Logger } from "./lib/logger.js";
import { execAsync } from "./lib/utils.js";
import { _resolveOutputFolder, NetEmitterOptions, resolveOptions } from "./options.js";
import { defaultSDKContextOptions } from "./sdk-context-options.js";
import { Configuration } from "./type/configuration.js";

export interface CSharpEmitterContext extends SdkContext<NetEmitterOptions> {
  logger: Logger;
}

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
export async function $onEmit(context: EmitContext<NetEmitterOptions>) {
  const program: Program = context.program;
  const options = resolveOptions(context);
  const outputFolder = _resolveOutputFolder(context);

  /* set the loglevel. */
  const logger = new Logger(program, options.logLevel ?? LoggerLevel.INFO);

  if (!program.compilerOptions.noEmit && !program.hasError()) {
    // Write out the dotnet model to the output path
    const sdkContext = await createSdkContext(
      context,
      "@typespec/http-client-csharp",
      defaultSDKContextOptions,
    );
    const csharpEmitterContext = { ...sdkContext, logger: logger };
    const root = createModel(csharpEmitterContext);
    if (
      context.program.diagnostics.length > 0 &&
      context.program.diagnostics.filter((digs) => digs.severity === "error").length > 0
    ) {
      logDiagnostics(context.program.diagnostics, context.program.host.logSink);
      process.exit(1);
    }

    if (root) {
      const generatedFolder = resolvePath(outputFolder, "src", "Generated");

      if (!fs.existsSync(generatedFolder)) {
        fs.mkdirSync(generatedFolder, { recursive: true });
      }

      await program.host.writeFile(
        resolvePath(outputFolder, tspOutputFileName),
        prettierOutput(stringifyRefs(root, transformJSONProperties, 1, PreserveType.Objects)),
      );

      //emit configuration.json
      const namespace = root.Name;
      const configurations: Configuration = {
        "output-folder": ".",
        "package-name": options["package-name"] ?? namespace,
        "unreferenced-types-handling": options["unreferenced-types-handling"],
        "disable-xml-docs":
          options["disable-xml-docs"] === false ? undefined : options["disable-xml-docs"],
      };

      await program.host.writeFile(
        resolvePath(outputFolder, configurationFileName),
        prettierOutput(JSON.stringify(configurations, null, 2)),
      );

      if (options.skipSDKGeneration !== true) {
        const csProjFile = resolvePath(
          outputFolder,
          "src",
          `${configurations["package-name"]}.csproj`,
        );
        logger.info(`Checking if ${csProjFile} exists`);
        const newProjectOption =
          options["new-project"] || !checkFile(csProjFile) ? "--new-project" : "";
        const debugFlag = (options.debug ?? false) ? "--debug" : "";

        const emitterPath = options["emitter-extension-path"] ?? import.meta.url;
        const projectRoot = findProjectRoot(dirname(fileURLToPath(emitterPath)));
        const generatorPath = resolvePath(
          projectRoot + "/dist/generator/Microsoft.TypeSpec.Generator.dll",
        );

        const command = `dotnet --roll-forward Major ${generatorPath} ${outputFolder} -p ${options["plugin-name"]}${constructCommandArg(newProjectOption)}${constructCommandArg(debugFlag)}`;
        logger.info(command);

        try {
          const result = await execAsync(
            "dotnet",
            [
              "--roll-forward",
              "Major",
              generatorPath,
              outputFolder,
              "-p",
              options["plugin-name"],
              newProjectOption,
              debugFlag,
            ],
            { stdio: "inherit" },
          );
          if (result.exitCode !== 0) {
            const isValid = await _validateDotNetSdk(
              csharpEmitterContext,
              _minSupportedDotNetSdkVersion,
            );
            // if the dotnet sdk is valid, the error is not dependency issue, log it as normal
            if (isValid) {
              if (result.stderr) logger.error(result.stderr);
              if (result.stdout) logger.verbose(result.stdout);
              throw new Error(`Failed to generate the library. Exit code: ${result.exitCode}`);
            }
          }
        } catch (error: any) {
          const isValid = await _validateDotNetSdk(
            csharpEmitterContext,
            _minSupportedDotNetSdkVersion,
          );
          // if the dotnet sdk is valid, the error is not dependency issue, log it as normal
          if (isValid) throw new Error(error);
        }
        if (!options["save-inputs"]) {
          // delete
          deleteFile(resolvePath(outputFolder, tspOutputFileName), logger);
          deleteFile(resolvePath(outputFolder, configurationFileName), logger);
        }
      }
    }
  }
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
    if (error && "code" in (error as {}) && error["code"] === "ENOENT") {
      reportDiagnostic(sdkContext.program, {
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
      sdkContext.logger.error("Invalid .NET SDK version.");
      return false;
    }
    if (major < minMajorVersion) {
      reportDiagnostic(sdkContext.program, {
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

function constructCommandArg(arg: string): string {
  return arg !== "" ? ` ${arg}` : "";
}

function transformJSONProperties(this: any, key: string, value: any): any {
  // convertUsageNumbersToStrings
  if (this["kind"] === "model" || this["kind"] === "enum") {
    if (key === "usage" && typeof value === "number") {
      if (value === 0) {
        return "None";
      }
      const result: string[] = [];
      for (const prop in UsageFlags) {
        if (!isNaN(Number(prop))) {
          if ((value & Number(prop)) !== 0) {
            result.push(UsageFlags[prop]);
          }
        }
      }
      return result.join(",");
    }
  }

  // skip __raw if there is one
  if (key === "__raw") {
    return undefined;
  }

  return value;
}

function deleteFile(filePath: string, logger: Logger) {
  fs.unlink(filePath, (err) => {
    if (err) {
      logger.error(`Failed to delete files: ${err}`);
    } else {
      logger.info(`File ${filePath} is deleted.`);
    }
  });
}

function prettierOutput(output: string) {
  return output + "\n";
}

function checkFile(pkgPath: string) {
  try {
    return statSync(pkgPath);
  } catch (error) {
    return undefined;
  }
}
