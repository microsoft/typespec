/* eslint-disable no-console */
import { fileURLToPath } from "url";
import { stringify } from "yaml";
import { loadTypeSpecConfigForPath } from "../../../config/config-loader.js";
import { CompilerHost, Diagnostic } from "../../types.js";
/**
 * Print the resolved TypeSpec configuration.
 */
export async function printInfoAction(host: CompilerHost): Promise<readonly Diagnostic[]> {
  const cwd = process.cwd();
  console.log(`Module: ${fileURLToPath(import.meta.url)}`);

  const config = await loadTypeSpecConfigForPath(host, cwd, true, true);
  const { diagnostics, filename, ...restOfConfig } = config;

  console.log(`User Config: ${config.filename ?? "No config file found"}`);
  console.log("-----------");
  console.log(stringify(restOfConfig));
  console.log("-----------");
  return config.diagnostics;
}
