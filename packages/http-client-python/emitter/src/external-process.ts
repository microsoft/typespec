import { joinPaths } from "@typespec/compiler";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import jsyaml from "js-yaml";
import os from "os";

const tspCodeGenTempDir = joinPaths(os.tmpdir(), "tsp-codegen");

export function createTempPath(extension: string, prefix: string = "") {
  return joinPaths(tspCodeGenTempDir, prefix + randomUUID() + extension);
}

/**
 * Serialize the given codemodel to a YAML string.
 *
 * The generated YAML is consumed by the Python generator, which parses it with
 * PyYAML (YAML 1.1). js-yaml, on the other hand, dumps using YAML 1.2 rules, so
 * plain scalars such as `2020_01_01` (a snake-cased enum member name) are left
 * unquoted because YAML 1.2 does not treat underscores as integer separators.
 * PyYAML would then read `2020_01_01` back as the integer `20200101`, corrupting
 * string values (e.g. enum member names, descriptions). Forcing every string
 * scalar to be quoted guarantees that PyYAML round-trips them as strings.
 * @param codemodel Codemodel to serialize
 * @return the YAML representation of the codemodel.
 */
export function dumpCodeModelToYaml(codemodel: unknown): string {
  return jsyaml.dump(codemodel, { forceQuotes: true, quotingType: '"' });
}

/**
 * Save the given codemodel in a yaml file.
 * @param name Name of the codemodel. To give a guide to the temp file name.
 * @param codemodel Codemodel to save
 * @return the absolute path to the created codemodel.
 */
export async function saveCodeModelAsYaml(name: string, codemodel: unknown): Promise<string> {
  await mkdir(tspCodeGenTempDir, { recursive: true });
  const filename = createTempPath(".yaml", name);
  const yamlStr = dumpCodeModelToYaml(codemodel);
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
