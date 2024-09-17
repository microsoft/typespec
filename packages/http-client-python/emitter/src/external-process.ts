import { joinPaths } from "@typespec/compiler";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import jsyaml from "js-yaml";
import os from "os";

const cadlCodeGenTempDir = joinPaths(os.tmpdir(), "cadl-codegen");

export function createTempPath(extension: string, prefix: string = "") {
  return joinPaths(cadlCodeGenTempDir, prefix + randomUUID() + extension);
}

/**
 * Save the given codemodel in a yaml file.
 * @param name Name of the codemodel. To give a guide to the temp file name.
 * @param codemodel Codemodel to save
 * @return the absolute path to the created codemodel.
 */
export async function saveCodeModelAsYaml(name: string, codemodel: unknown): Promise<string> {
  await mkdir(cadlCodeGenTempDir, { recursive: true });
  const filename = createTempPath(".yaml", name);
  const yamlStr = jsyaml.dump(codemodel);
  await writeFile(filename, yamlStr);
  return filename;
}

/**
 * Start external process async
 * @param command Command to run. This is the just the executable path or name.
 * @param args Command arguments.
 * @param options Options
 */
export async function execAsync(
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; proc: ChildProcess }> {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        proc: child,
      });
    });
  });
}
