import { joinPaths } from "@typespec/compiler";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import os from "os";
import { serializeCodeModel } from "./code-model-serializer.js";

const tspCodeGenTempDir = joinPaths(os.tmpdir(), "tsp-codegen");

export function createTempPath(extension: string, prefix: string = "") {
  return joinPaths(tspCodeGenTempDir, prefix + randomUUID() + extension);
}

/**
 * Save the given codemodel in a JSON file.
 *
 * The codemodel is a cyclic object graph with shared references, so it is serialized with
 * the `$id`/`$ref` reference-preserving convention (the same one used by the C# emitter
 * and System.Text.Json's `ReferenceHandler.Preserve`), which preserves cycles and
 * structural sharing. The Python generator reads it back with a matching decoder.
 * @param name Name of the codemodel. To give a guide to the temp file name.
 * @param codemodel Codemodel to save
 * @return the absolute path to the created codemodel.
 */
export async function saveCodeModel(name: string, codemodel: unknown): Promise<string> {
  await mkdir(tspCodeGenTempDir, { recursive: true });
  const filename = createTempPath(".json", name);
  await writeFile(filename, serializeCodeModel(codemodel));
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
