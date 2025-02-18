import { NoTarget, Type } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { CSharpEmitterContext } from "../sdk-context.js";
import path from "path";

export async function execCSharpGenerator(
  context: CSharpEmitterContext,
  options: {
    generatorPath: string;
    outputFolder: string;
    pluginName: string;
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
    "-p",
    options.pluginName,
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

    child.stdout?.on("data", async (data) => {
      buffer += data.toString();
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        const message = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        // context.logger.info(`Received from C#: ${message}`);
        await processJsonRpc(context, message);
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

async function processJsonRpc(context: CSharpEmitterContext, message: string): Promise<void> {
  const response = JSON.parse(message);
  const method = response.method;
  const params = response.params;
  switch (method) {
    case "info":
      context.logger.info(params.message);
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
    case "file":
      const filepath = params.path;
      const content = params.content;
      context.logger.info(`Writing ${filepath}`);
      // get the directory name of path
      const dirPath = path.dirname(filepath);
      await context.program.host.mkdirp(dirPath);
      context.program.host.writeFile(filepath, content);
      break;
  }

  function findTarget(crossLanguageDefinitionId: string | undefined): Type | undefined {
    if (crossLanguageDefinitionId === undefined) {
      return undefined;
    }
    const target = context.__typeCache.crossLanguageDefinitionIds.get(crossLanguageDefinitionId);
    if (target) {
      return target.__raw;
    }
    return undefined;
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
