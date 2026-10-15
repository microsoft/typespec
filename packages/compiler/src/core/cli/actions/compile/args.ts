import { resolveCompilerOptions } from "../../../../config/config-to-options.js";
import { omitUndefined } from "../../../../utils/misc.js";
import { createDiagnosticCollector } from "../../../diagnostics.js";
import { linterRuleSetFilePrefix } from "../../../linter-ruleset-file.js";
import { createDiagnostic } from "../../../messages.js";
import type { CompilerOptions } from "../../../options.js";
import { resolvePath } from "../../../path-utils.js";
import type {
  CompilerHost,
  Diagnostic,
  LinterRuleEnableValue,
  RuleRef,
  RuleSetRef,
} from "../../../types.js";
import { NoTarget } from "../../../types.js";
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
  "no-linter"?: boolean;
  "linter-ruleset"?: string[];
  "linter-rule"?: string[];
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
  const linterOverrides = diagnostics.pipe(resolveCliLinterOptions(args, cwd));
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
  } else if (args["ignore-deprecated"]) {
    resolvedOptions.ignoreDeprecated = true;
  }
  if (args["no-linter"]) {
    resolvedOptions.linterRuleSet = undefined;
  }

  return diagnostics.wrap(
    omitUndefined({
      ...resolvedOptions,
      miscOptions: cliOptions.miscOptions,
      linterRuleSetOverrides: linterOverrides,
    }),
  );
}

function resolveCliLinterOptions(
  args: CompileCliArgs,
  cwd: string,
): [CompilerOptions["linterRuleSetOverrides"], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (args["no-linter"] && (args["linter-ruleset"] || args["linter-rule"])) {
    diagnostics.add(createDiagnostic({ code: "conflicting-linter-flags", target: NoTarget }));
    return diagnostics.wrap(undefined);
  }
  if (args["linter-ruleset"] === undefined && args["linter-rule"] === undefined) {
    return diagnostics.wrap(undefined);
  }

  const ruleSets: RuleSetRef[] = [];
  for (const ref of args["linter-ruleset"] ?? []) {
    if (ref.startsWith(linterRuleSetFilePrefix) && ref.length > linterRuleSetFilePrefix.length) {
      ruleSets.push(`file:${resolvePath(cwd, ref.slice(linterRuleSetFilePrefix.length))}`);
    } else if (isRuleRef(ref)) {
      ruleSets.push(ref);
    } else {
      diagnostics.add(
        createDiagnostic({ code: "invalid-rule-ref", format: { ref }, target: NoTarget }),
      );
    }
  }

  const rules: [RuleRef, LinterRuleEnableValue][] = [];
  for (const option of args["linter-rule"] ?? []) {
    const separator = option.indexOf("=");
    const ref = option.slice(0, separator);
    let value: unknown;
    if (separator !== -1 && isRuleRef(ref)) {
      try {
        value = JSON.parse(option.slice(separator + 1));
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          throw error;
        }
      }
    }
    if (!isRuleRef(ref) || !isLinterRuleEnableValue(value)) {
      diagnostics.add(
        createDiagnostic({
          code: "invalid-linter-rule-flag",
          format: { value: option },
          target: NoTarget,
        }),
      );
      continue;
    }
    rules.push([ref, value]);
  }

  return diagnostics.wrap({
    extends: args["linter-ruleset"] === undefined ? undefined : ruleSets,
    rules,
  });
}

function isLinterRuleEnableValue(value: unknown): value is LinterRuleEnableValue {
  return (
    typeof value === "boolean" ||
    (typeof value === "object" && value !== null && !Array.isArray(value))
  );
}

function isRuleRef(ref: string): ref is RuleRef {
  const separator = ref.lastIndexOf("/");
  return separator > 0 && separator < ref.length - 1;
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
