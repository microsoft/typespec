/* eslint-disable no-console */
import { fileURLToPath } from "url";
import { stringify } from "yaml";
import { loadTypeSpecConfigForPath } from "../../../config/config-loader.js";
import { CompilerHost, Diagnostic } from "../../types.js";
import { printEmitterOptionsAction } from "./info/emitter-options.js";

export interface InfoCliArgs {
  emitter?: string;
}

/**
 * Print the resolved TypeSpec configuration, or emitter options if an emitter is specified.
 */
export async function printInfoAction(
  host: CompilerHost,
  args: InfoCliArgs,
): Promise<readonly Diagnostic[]> {
  if (args.emitter) {
    return printEmitterOptionsAction(host, args.emitter);
  }

  const cwd = process.cwd();
  console.log(`Module: ${fileURLToPath(import.meta.url)}`);

  const config = await loadTypeSpecConfigForPath(host, cwd, true, true);
  const { diagnostics, filename, file, ...restOfConfig } = config;

  console.log(`User Config: ${filename ?? "No config file found"}`);
  console.log("-----------");
  console.log(stringify(restOfConfig));
  console.log("-----------");
  return config.diagnostics;
}
