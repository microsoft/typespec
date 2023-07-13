/* eslint-disable no-console */
import { fileURLToPath } from "url";
import { loadTypeSpecConfigForPath } from "../../../config/config-loader.js";
import { CompilerHost, Diagnostic } from "../../types.js";

/**
 * Print the resolved TypeSpec configuration.
 */
export async function printInfoAction(host: CompilerHost): Promise<readonly Diagnostic[]> {
  const cwd = process.cwd();
  console.log(`Module: ${fileURLToPath(import.meta.url)}`);

  const config = await loadTypeSpecConfigForPath(host, cwd);
  const jsyaml = await import("js-yaml");
  const excluded = ["diagnostics", "filename"];
  const replacer = (emitter: string, value: any) =>
    excluded.includes(emitter) ? undefined : value;

  console.log(`User Config: ${config.filename ?? "No config file found"}`);
  console.log("-----------");
  console.log(jsyaml.dump(config, { replacer }));
  console.log("-----------");
  return config.diagnostics;
}
