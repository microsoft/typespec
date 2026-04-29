// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

// Node.js implementation: runs the .NET generator locally via subprocess.

import {
  createDiagnosticCollector,
  Diagnostic,
  getDirectoryPath,
  joinPaths,
  NoTarget,
  resolvePath,
} from "@typespec/compiler";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  _minSupportedDotNetSdkVersion,
  configurationFileName,
  tspOutputFileName,
} from "./constants.js";
import { createDiagnostic } from "./lib/lib.js";
import { execAsync, execCSharpGenerator } from "./lib/utils.js";
import { CSharpEmitterContext } from "./sdk-context.js";

export interface GenerateOptions {
  outputFolder: string;
  packageName: string;
  generatorName: string;
  newProject: boolean;
  debug: boolean;
  saveInputs: boolean;
  emitterExtensionPath?: string;
}

function findProjectRoot(path: string): string | undefined {
  let current = path;
  while (true) {
    const pkgPath = joinPaths(current, "package.json");
    try {
      if (fs.statSync(pkgPath)?.isFile()) {
        return current;
      }
    } catch {
      // file doesn't exist
    }
    const parent = getDirectoryPath(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

function checkFile(pkgPath: string) {
  try {
    return fs.statSync(pkgPath);
  } catch {
    return undefined;
  }
}

export async function generate(
  sdkContext: CSharpEmitterContext,
  codeModelJson: string,
  configJson: string,
  options: GenerateOptions,
): Promise<void> {
  const diagnostics = createDiagnosticCollector();

  const generatedFolder = resolvePath(options.outputFolder, "src", "Generated");
  if (!fs.existsSync(generatedFolder)) {
    fs.mkdirSync(generatedFolder, { recursive: true });
  }

  // Write code model and configuration to disk for the generator
  await sdkContext.program.host.writeFile(
    resolvePath(options.outputFolder, tspOutputFileName),
    codeModelJson,
  );
  await sdkContext.program.host.writeFile(
    resolvePath(options.outputFolder, configurationFileName),
    configJson,
  );

  const csProjFile = resolvePath(options.outputFolder, "src", `${options.packageName}.csproj`);

  const emitterPath = options.emitterExtensionPath ?? import.meta.url;
  const projectRoot = findProjectRoot(dirname(fileURLToPath(emitterPath)));
  const generatorPath = resolvePath(
    projectRoot + "/dist/generator/Microsoft.TypeSpec.Generator.dll",
  );

  try {
    const result = await execCSharpGenerator(sdkContext, {
      generatorPath: generatorPath,
      outputFolder: options.outputFolder,
      generatorName: options.generatorName,
      newProject: options.newProject || !checkFile(csProjFile),
      debug: options.debug,
    });
    if (result.exitCode !== 0) {
      const isValid = diagnostics.pipe(
        await _validateDotNetSdk(sdkContext, _minSupportedDotNetSdkVersion),
      );
      if (isValid) {
        throw new Error(
          `Failed to generate the library. Exit code: ${result.exitCode}.\nStackTrace: \n${result.stderr}`,
        );
      }
    }
  } catch (error: any) {
    const isValid = diagnostics.pipe(
      await _validateDotNetSdk(sdkContext, _minSupportedDotNetSdkVersion),
    );
    if (isValid) throw new Error(error, { cause: error });
  }

  if (!options.saveInputs) {
    sdkContext.program.host.rm(resolvePath(options.outputFolder, tspOutputFileName));
    sdkContext.program.host.rm(resolvePath(options.outputFolder, configurationFileName));
  }

  sdkContext.program.reportDiagnostics(diagnostics.diagnostics);
}

/** @internal */
export async function _validateDotNetSdk(
  sdkContext: CSharpEmitterContext,
  minMajorVersion: number,
): Promise<[boolean, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  try {
    const result = await execAsync("dotnet", ["--version"], { stdio: "pipe" });
    return diagnostics.wrap(
      diagnostics.pipe(validateDotNetSdkVersionCore(result.stdout, minMajorVersion)),
    );
  } catch (error: any) {
    if (error && "code" in error && error["code"] === "ENOENT") {
      diagnostics.add(
        createDiagnostic({
          code: "invalid-dotnet-sdk-dependency",
          messageId: "missing",
          format: {
            dotnetMajorVersion: `${minMajorVersion}`,
            downloadUrl: "https://dotnet.microsoft.com/",
          },
          target: NoTarget,
        }),
      );
    }
    return diagnostics.wrap(false);
  }
}

function validateDotNetSdkVersionCore(
  version: string,
  minMajorVersion: number,
): [boolean, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (version) {
    const dotIndex = version.indexOf(".");
    const firstPart = dotIndex === -1 ? version : version.substring(0, dotIndex);
    const major = Number(firstPart);

    if (isNaN(major)) {
      return diagnostics.wrap(false);
    }
    if (major < minMajorVersion) {
      diagnostics.add(
        createDiagnostic({
          code: "invalid-dotnet-sdk-dependency",
          messageId: "invalidVersion",
          format: {
            installedVersion: version,
            dotnetMajorVersion: `${minMajorVersion}`,
            downloadUrl: "https://dotnet.microsoft.com/",
          },
          target: NoTarget,
        }),
      );
      return diagnostics.wrap(false);
    }
    return diagnostics.wrap(true);
  } else {
    diagnostics.add(
      createDiagnostic({
        code: "general-error",
        format: { message: "Cannot get the installed .NET SDK version." },
        target: NoTarget,
      }),
    );
    return diagnostics.wrap(false);
  }
}
