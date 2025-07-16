import { resolveCompilerOptions } from "../../../../config/config-to-options.js";
import { omitUndefined } from "../../../../utils/misc.js";
import { createDiagnosticCollector } from "../../../diagnostics.js";
import { createDiagnostic } from "../../../messages.js";
import { CompilerOptions } from "../../../options.js";
import { resolvePath } from "../../../path-utils.js";
import { CompilerHost, Diagnostic, NoTarget } from "../../../types.js";
import { parseCliArgsArgOption } from "../../utils.js";

export interface CompileCliArgs {
  path?: string;
  pretty?: boolean;
  /** Print statistics about the compilation(Task duration, types created, etc.) */
  stats?: boolean;
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
  "list-files"?: boolean;
  "no-emit"?: boolean;
  "dry-run"?: boolean;
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

  const cliOptions = diagnostics.pipe(resolveCliOptions(args));
  const resolvedOptions = diagnostics.pipe(
    await resolveCompilerOptions(host, {
      entrypoint,
      configPath: args["config"] && resolvePath(cwd, args["config"]),
      cwd,
      args: parseCliArgsArgOption(args.args),
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
  } else if (args["list-files"]) {
    resolvedOptions.listFiles = true;
  } else if (args["dry-run"]) {
    resolvedOptions.dryRun = true;
  }

  return diagnostics.wrap(
    omitUndefined({
      ...resolvedOptions,
      miscOptions: cliOptions.miscOptions,
    }),
  );
}

function resolveCliOptions(args: CompileCliArgs): [
  {
    options: Record<string, Record<string, unknown>>;
    miscOptions: Record<string, string> | undefined;
  },
  readonly Diagnostic[],
] {
  const diagnostics: Diagnostic[] = [];
  let miscOptions: Record<string, string> | undefined;
  const options: Record<string, any> = {};
  for (const option of args.options ?? []) {
    const optionParts = option.split("=");
    if (optionParts.length !== 2) {
      diagnostics.push(
        createDiagnostic({
          code: "invalid-option-flag",
          target: NoTarget,
          format: { value: option },
        }),
      );
      continue;
    }
    const optionKeyParts = optionParts[0].split(".");
    if (optionKeyParts.length === 1) {
      const key = optionKeyParts[0];
      if (miscOptions === undefined) {
        miscOptions = {};
      }
      miscOptions[key] = optionParts[1];
      continue;
    }

    let current: any = options;
    for (let i = 0; i < optionKeyParts.length; i++) {
      const part = optionKeyParts[i];
      if (i === optionKeyParts.length - 1) {
        current[part] = optionParts[1];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return [{ options, miscOptions }, diagnostics];
}
