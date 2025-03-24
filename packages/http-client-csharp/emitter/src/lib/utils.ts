import { listAllServiceNamespaces } from "@azure-tools/typespec-client-generator-core";
import { getNamespaceFullName, Namespace, NoTarget, Type } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { CSharpEmitterContext } from "../sdk-context.js";

export async function execCSharpGenerator(
  context: CSharpEmitterContext,
  options: {
    generatorPath: string;
    outputFolder: string;
    generatorName: string;
    newProject: boolean;
    debug: boolean;
  },
): Promise<{ exitCode: number; stderr: string; proc: any }> {
  const command = "dotnet";
  const args = [
    "--roll-forward",
    "Major",
    options.generatorPath,
    options.outputFolder,
    "-g",
    options.generatorName,
  ];
  if (options.newProject) {
    args.push("--new-project");
  }
  if (options.debug) {
    args.push("--debug");
  }
  context.logger.info(`${command} ${args.join(" ")}`);

  const child = spawn(command, args, { stdio: "pipe" });

  const stderr: Buffer[] = [];
  return new Promise((resolve, reject) => {
    let buffer = "";

    child.stdout?.on("data", (data) => {
      buffer += data.toString();
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        const message = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        processJsonRpc(context, message);
      }
    });

    child.stderr?.on("data", (data) => {
      stderr.push(data);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

function processJsonRpc(context: CSharpEmitterContext, message: string) {
  const response = JSON.parse(message);
  const method = response.method;
  const params = response.params;
  switch (method) {
    case "trace":
      context.logger.trace(params.level, params.message);
      break;
    case "diagnostic":
      let crossLanguageDefinitionId: string | undefined;
      if ("crossLanguageDefinitionId" in params) {
        crossLanguageDefinitionId = params.crossLanguageDefinitionId;
      }
      context.logger.reportDiagnostic({
        code: params.code,
        format: {
          message: params.message,
        },
        target: findTarget(crossLanguageDefinitionId) ?? NoTarget,
      });
      break;
  }

  function findTarget(crossLanguageDefinitionId: string | undefined): Type | undefined {
    if (crossLanguageDefinitionId === undefined) {
      return undefined;
    }
    return context.__typeCache.crossLanguageDefinitionIds.get(crossLanguageDefinitionId);
  }
}

export async function execAsync(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; stdio: string; stdout: string; stderr: string; proc: any }> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdio: Buffer[] = [];
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (data) => {
      stdout.push(data);
      stdio.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
      stdio.push(data);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdio: Buffer.concat(stdio).toString(),
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

export function getClientNamespaceString(context: CSharpEmitterContext): string | undefined {
  return getClientNamespaceStringHelper(
    context.emitContext.options["package-name"],
    listAllServiceNamespaces(context)[0],
  );
}

export function getClientNamespaceStringHelper(
  packageName?: string,
  namespace?: Namespace,
): string | undefined {
  if (packageName) {
    packageName = packageName
      .replace(/-/g, ".")
      .replace(/\.([a-z])?/g, (match: string) => match.toUpperCase());
    return packageName.charAt(0).toUpperCase() + packageName.slice(1);
  }
  if (namespace) {
    return getNamespaceFullName(namespace);
  }
  return undefined;
}
