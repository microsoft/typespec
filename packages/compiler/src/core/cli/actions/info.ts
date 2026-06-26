/* eslint-disable no-console */
import pc from "picocolors";
import { fileURLToPath } from "url";
import { stringify } from "yaml";
import { loadTypeSpecConfigForPath } from "../../../config/config-loader.js";
import type { TypeSpecConfig } from "../../../config/types.js";
import { compilerFeatureNames, compilerFeatures } from "../../features.js";
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
  if (args.emitter === "features") {
    const config = await loadTypeSpecConfigForPath(host, process.cwd(), false, true);
    console.log(formatCompilerFeatures(config).join("\n"));
    return config.diagnostics;
  }

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

export function formatCompilerFeatures(config?: TypeSpecConfig): string[] {
  const enabledFeatures = new Set(config?.features ?? []);
  const lines: string[] = [];

  lines.push(pc.bold("Compiler Features"));
  lines.push("");

  const statusWidth = "disabled".length;
  const nameWidth = Math.max(...compilerFeatureNames.map((name) => name.length));

  for (const name of compilerFeatureNames) {
    const enabled = enabledFeatures.has(name);
    const status = enabled
      ? pc.green("enabled".padEnd(statusWidth))
      : pc.dim("disabled".padEnd(statusWidth));
    const featureName = name.padEnd(nameWidth);
    const description = compilerFeatures[name].description;

    lines.push(`  ${status}  ${pc.bold(pc.cyan(featureName))}  ${description}`);
  }

  return lines;
}
