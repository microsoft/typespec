import { resolveCompilerOptions } from "../../../../config/config-to-options.js";
import { omitUndefined } from "../../../../utils/misc.js";
import { createDiagnosticCollector } from "../../../diagnostics.js";
import { CompilerOptions } from "../../../options.js";
import { resolvePath } from "../../../path-utils.js";
import { CompilerHost, Diagnostic } from "../../../types.js";

export interface CompileCliArgs {
  "output-dir"?: string;
  "output-path"?: string;
  nostdlib?: boolean;
  options?: string[];
  import?: string[];
  watch?: boolean;
  emit?: string[];
  trace?: string[];
  debug?: boolean;
  config?: string;
  "warn-as-error"?: boolean;
  "no-emit"?: boolean;
  "ignore-deprecated"?: boolean;
  args?: string[];
}

export async function getCompilerOptions(
  host: CompilerHost,
  entrypoint: string,
  cwd: string,
  args: CompileCliArgs,
  env: Record<string, string | undefined>,
): Promise<[CompilerOptions | undefined, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();

  const pathArg = args["output-dir"] ?? args["output-path"];
  const cliOutputDir = pathArg
    ? pathArg.startsWith("{")
      ? pathArg
      : resolvePath(cwd, pathArg)
    : undefined;

  const cliOptions = resolveCliOptions(args);
  const resolvedOptions = diagnostics.pipe(
    await resolveCompilerOptions(host, {
      entrypoint,
      configPath: args["config"] && resolvePath(cwd, args["config"]),
      cwd,
      args: resolveConfigArgs(args),
      env,
      overrides: omitUndefined({
        outputDir: cliOutputDir,
        imports: args["import"],
        warnAsError: args["warn-as-error"],
        trace: args.trace,
        emit: args.emit,
        options: cliOptions.options,
      }),
    }),
  );
  if (args["no-emit"]) {
    resolvedOptions.noEmit = true;
  }

  return diagnostics.wrap(
    omitUndefined({
      ...resolvedOptions,
      miscOptions: cliOptions.miscOptions,
    }),
  );
}

function resolveConfigArgs(args: CompileCliArgs): Record<string, string> {
  const map: Record<string, string> = {};
  for (const arg of args.args ?? []) {
    const optionParts = arg.split("=");
    if (optionParts.length !== 2) {
      throw new Error(`The --arg parameter value "${arg}" must be in the format: arg-name=value`);
    }

    map[optionParts[0]] = optionParts[1];
  }

  return map;
}
function resolveCliOptions(args: CompileCliArgs): {
  options: Record<string, Record<string, unknown>>;
  miscOptions: Record<string, string> | undefined;
} {
  let miscOptions: Record<string, string> | undefined;
  const options: Record<string, Record<string, string>> = {};
  for (const option of args.options ?? []) {
    const optionParts = option.split("=");
    if (optionParts.length !== 2) {
      throw new Error(
        `The --option parameter value "${option}" must be in the format: <emitterName>.some-options=value`,
      );
    }
    let optionKeyParts = optionParts[0].split(".");
    if (optionKeyParts.length === 1) {
      const key = optionKeyParts[0];
      if (miscOptions === undefined) {
        miscOptions = {};
      }
      miscOptions[key] = optionParts[1];
      continue;
    } else if (optionKeyParts.length > 2) {
      // support emitter/path/file.js.option=xyz
      optionKeyParts = [
        optionKeyParts.slice(0, -1).join("."),
        optionKeyParts[optionKeyParts.length - 1],
      ];
    }
    const emitterName = optionKeyParts[0];
    const key = optionKeyParts[1];
    if (!(emitterName in options)) {
      options[emitterName] = {};
    }
    options[emitterName][key] = optionParts[1];
  }
  return { options, miscOptions };
}
