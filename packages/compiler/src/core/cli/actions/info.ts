import { fileURLToPath } from "url";
import { loadTypeSpecConfigForPath } from "../../../config/config-loader.js";
import { logDiagnostics } from "../../diagnostics.js";
import { CompilerHost } from "../../types.js";
import { logDiagnosticCount } from "../utils.js";

/**
 * Print the resolved TypeSpec configuration.
 */
export async function printInfoAction(host: CompilerHost) {
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
  logDiagnostics(config.diagnostics, host.logSink);
  logDiagnosticCount(config.diagnostics);
  if (config.diagnostics.some((d) => d.severity === "error")) {
    process.exit(1);
  }
}
