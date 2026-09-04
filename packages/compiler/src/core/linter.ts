import { isPromise } from "../utils/misc.js";
import type { DiagnosticCodeResolver } from "./diagnostic-code.js";
import { formatShortNameCandidates } from "./diagnostic-code.js";
import type { DiagnosticCollector } from "./diagnostics.js";
import { compilerAssert, createDiagnosticCollector } from "./diagnostics.js";
import { getLocationContext } from "./helpers/location-context.js";
import { defineLinter } from "./library.js";
import { createUnusedTemplateParameterLinterRule } from "./linter-rules/unused-template-parameter.rule.js";
import { createUnusedUsingLinterRule } from "./linter-rules/unused-using.rule.js";
import { createDiagnostic } from "./messages.js";
import { perf } from "./perf.js";
import type { Program } from "./program.js";
import { createJSONSchemaValidator } from "./schema-validator.js";
import { EventEmitter, mapEventEmitterToNodeListener, navigateProgram } from "./semantic-walker.js";
import type {
  Diagnostic,
  DiagnosticMessages,
  DiagnosticTarget,
  LinterDefinition,
  LinterResolvedDefinition,
  LinterRule,
  LinterRuleContext,
  LinterRuleDiagnosticReport,
  LinterRuleEnableValue,
  LinterRuleSet,
  Node,
  RuleRef,
  SemanticNodeListener,
  TemplateParameter,
  Type,
  TypeMapper,
} from "./types.js";
import { NoTarget, SyntaxKind } from "./types.js";

type LinterLibraryInstance = { linter: LinterResolvedDefinition };

export interface Linter {
  extendRuleSet(ruleSet: LinterRuleSet): Promise<readonly Diagnostic[]>;
  registerLinterLibrary(name: string, lib?: LinterLibraryInstance): void;
  lint(): Promise<LinterResult>;
}

export interface LinterStats {
  runtime: {
    total: number;
    rules: Record<string, number>;
  };
}
export interface LinterResult {
  readonly diagnostics: readonly Diagnostic[];
  readonly stats: LinterStats;
}

/**
 * Resolve the linter definition
 */
export function resolveLinterDefinition(
  libName: string,
  linter: LinterDefinition,
): LinterResolvedDefinition {
  const rules: LinterRule<string, any>[] = linter.rules.map((rule) => {
    return { ...rule, id: `${libName}/${rule.name}` };
  });
  if (linter.rules.length === 0 || (linter.ruleSets && "all" in linter.ruleSets)) {
    return {
      rules,
      ruleSets: linter.ruleSets ?? {},
    };
  } else {
    return {
      rules,
      ruleSets: {
        all: {
          enable: Object.fromEntries(rules.map((x) => [x.id, true])) as any,
        },
        ...linter.ruleSets,
      },
    };
  }
}

export function createLinter(
  program: Program,
  loadLibrary: (name: string) => Promise<LinterLibraryInstance | undefined>,
  codeResolver?: DiagnosticCodeResolver,
): Linter {
  const tracer = program.tracer.sub("linter");

  const resolveCode = (ref: string): string => (codeResolver ? codeResolver.resolveCode(ref) : ref);

  /**
   * Report a warning when `ref` uses an ambiguous short name. Returns `true` if it was
   * ambiguous so the caller can skip processing that entry.
   */
  const reportIfAmbiguous = (ref: string, diagnostics: DiagnosticCollector): boolean => {
    const conflict = codeResolver?.getAmbiguousShortName(ref);
    if (conflict) {
      diagnostics.add(
        createDiagnostic({
          code: "ambiguous-short-name",
          format: {
            shortName: conflict.shortName,
            candidates: formatShortNameCandidates(conflict.candidates),
          },
          target: NoTarget,
        }),
      );
      return true;
    }
    return false;
  };

  const ruleMap = new Map<string, LinterRule<string, any, any>>();
  const enabledRules = new Map<
    string,
    { rule: LinterRule<string, any, any>; options: Record<string, unknown> }
  >();
  const linterLibraries = new Map<string, LinterLibraryInstance | undefined>();

  return {
    extendRuleSet,
    registerLinterLibrary,
    lint,
  };

  async function extendRuleSet(ruleSet: LinterRuleSet): Promise<readonly Diagnostic[]> {
    tracer.trace("extend-rule-set.start", JSON.stringify(ruleSet, null, 2));
    const diagnostics = createDiagnosticCollector();
    if (ruleSet.extends) {
      for (const extendingRuleSetName of ruleSet.extends) {
        if (reportIfAmbiguous(extendingRuleSetName, diagnostics)) {
          continue;
        }
        const ref = diagnostics.pipe(
          parseRuleReference(resolveCode(extendingRuleSetName) as RuleRef),
        );
        if (ref) {
          const library = await resolveLibrary(ref.libraryName);
          const libLinterDefinition = library?.linter;
          const extendingRuleSet = libLinterDefinition?.ruleSets?.[ref.name];
          if (extendingRuleSet) {
            await extendRuleSet(extendingRuleSet);
          } else {
            diagnostics.add(
              createDiagnostic({
                code: "unknown-rule-set",
                format: { libraryName: ref.libraryName, ruleSetName: ref.name },
                target: NoTarget,
              }),
            );
          }
        }
      }
    }

    const enabledInThisRuleSet = new Set<string>();
    if (ruleSet.enable) {
      for (const [rawRuleName, enableValue] of Object.entries(ruleSet.enable)) {
        if (enableValue === false) {
          continue;
        }
        if (reportIfAmbiguous(rawRuleName, diagnostics)) {
          continue;
        }
        const ruleName = resolveCode(rawRuleName);
        const ref = diagnostics.pipe(parseRuleReference(ruleName as RuleRef));
        if (ref) {
          await resolveLibrary(ref.libraryName);
          const rule = ruleMap.get(ruleName);
          if (rule) {
            enabledInThisRuleSet.add(ruleName);
            const [options, optionDiagnostics] = resolveRuleOptions(rule, enableValue);
            for (const d of optionDiagnostics) {
              diagnostics.add(d);
            }
            if (!optionDiagnostics.some((d) => d.severity === "error")) {
              enabledRules.set(ruleName, { rule, options });
            }
          } else {
            diagnostics.add(
              createDiagnostic({
                code: "unknown-rule",
                format: { libraryName: ref.libraryName, ruleName: ref.name },
                target: NoTarget,
              }),
            );
          }
        }
      }
    }

    if (ruleSet.disable) {
      for (const rawRuleName of Object.keys(ruleSet.disable)) {
        if (reportIfAmbiguous(rawRuleName, diagnostics)) {
          continue;
        }
        const ruleName = resolveCode(rawRuleName);
        if (enabledInThisRuleSet.has(ruleName)) {
          diagnostics.add(
            createDiagnostic({
              code: "rule-enabled-disabled",
              format: { ruleName },
              target: NoTarget,
            }),
          );
        }
        enabledRules.delete(ruleName);
      }
    }
    tracer.trace(
      "extend-rule-set.end",
      "Rules enabled: \n" + [...enabledRules.keys()].map((x) => ` - ${x}`).join("\n"),
    );

    return diagnostics.diagnostics;
  }

  async function lint(): Promise<LinterResult> {
    const syncLintResult = await lintInternal(false /* asyncRules */);
    const asyncLintResult = await lintInternal(true /* asyncRules */);

    return {
      diagnostics: [...syncLintResult.diagnostics, ...asyncLintResult.diagnostics],
      stats: {
        runtime: {
          total: syncLintResult.stats.runtime.total + asyncLintResult.stats.runtime.total,
          rules: {
            ...syncLintResult.stats.runtime.rules,
            ...asyncLintResult.stats.runtime.rules,
          },
        },
      },
    };
  }

  async function lintInternal(asyncRules: boolean): Promise<LinterResult> {
    const diagnostics = createDiagnosticCollector();
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    const stats: LinterStats = {
      runtime: {
        total: 0,
        rules: {},
      },
    };
    const filteredRules = new Map<
      string,
      { rule: LinterRule<string, any, any>; options: Record<string, unknown> }
    >();
    for (const [ruleId, entry] of enabledRules) {
      if ((entry.rule.async ?? false) === asyncRules) {
        filteredRules.set(ruleId, entry);
      }
    }
    tracer.trace(
      "lint",
      `Running ${asyncRules ? "async" : "sync"} linter with following rules:\n` +
        [...filteredRules.keys()].map((x) => ` - ${x}`).join("\n"),
    );

    const timer = perf.startTimer();
    const exitCallbacks = [];
    const EXIT_EVENT_NAME = "exit";
    const allPromises: Promise<any>[] = [];
    for (const { rule, options } of filteredRules.values()) {
      const createTiming = perf.startTimer();
      const listener = rule.create(createLinterRuleContext(program, rule, options, diagnostics));
      stats.runtime.rules[rule.id] = createTiming.end();
      for (const [name, cb] of Object.entries(listener)) {
        const timedCb = (...args: any[]) => {
          const timer = perf.startTimer();
          const result = (cb as any)(...args);
          if (name === EXIT_EVENT_NAME && isPromise(result)) {
            compilerAssert(
              rule.async,
              `Linter rule "${rule.id}" is not marked as async but returned a promise from the "${name}" callback.`,
            );
            const rr = result.finally(() => {
              const duration = timer.end();
              stats.runtime.rules[rule.id] += duration;
            });
            allPromises.push(rr);
          } else {
            const duration = timer.end();
            stats.runtime.rules[rule.id] += duration;
          }
        };
        if (name === EXIT_EVENT_NAME) {
          // we need to trigger 'exit' callbacks explicitly after semantic walker is done
          exitCallbacks.push(timedCb);
        } else {
          eventEmitter.on(name as any, timedCb);
        }
      }
    }
    navigateProgram(program, mapEventEmitterToNodeListener(eventEmitter));
    for (const cb of exitCallbacks) {
      cb(program);
    }
    if (allPromises.length > 0) {
      await Promise.all(allPromises);
    }

    stats.runtime.total = timer.end();
    return { diagnostics: diagnostics.diagnostics, stats };
  }

  async function resolveLibrary(name: string): Promise<LinterLibraryInstance | undefined> {
    const loadedLibrary = linterLibraries.get(name);
    if (loadedLibrary === undefined) {
      return registerLinterLibrary(name);
    }
    return loadedLibrary;
  }

  async function registerLinterLibrary(
    name: string,
    lib?: LinterLibraryInstance,
  ): Promise<LinterLibraryInstance | undefined> {
    tracer.trace("register-library", name);

    const library = lib ?? (await loadLibrary(name));
    const linter = library?.linter;
    if (linter?.rules) {
      for (const rule of linter.rules) {
        tracer.trace(
          "register-library.rule",
          `Registering rule "${rule.id}" for library "${name}".`,
        );
        if (ruleMap.has(rule.id)) {
          compilerAssert(false, `Unexpected duplicate linter rule: "${rule.id}"`);
        } else {
          ruleMap.set(rule.id, rule);
        }
      }
    }
    linterLibraries.set(name, library);

    return library;
  }

  function parseRuleReference(
    ref: RuleRef,
  ): [{ libraryName: string; name: string } | undefined, readonly Diagnostic[]] {
    const segments = ref.split("/");
    const name = segments.pop();
    const libraryName = segments.join("/");
    if (!libraryName || !name) {
      return [
        undefined,
        [createDiagnostic({ code: "invalid-rule-ref", format: { ref }, target: NoTarget })],
      ];
    }
    return [{ libraryName, name }, []];
  }

  function resolveRuleOptions(
    rule: LinterRule<string, any, any>,
    enableValue: Exclude<LinterRuleEnableValue, false>,
  ): [Record<string, unknown>, readonly Diagnostic[]] {
    const options =
      enableValue === true
        ? (rule.defaultOptions ?? {})
        : { ...(rule.defaultOptions ?? {}), ...enableValue };

    if (rule.optionSchema && enableValue !== true) {
      const validator = createJSONSchemaValidatorForRuleOptions(rule.optionSchema);
      const validationDiagnostics = validator.validate(options, NoTarget);
      if (validationDiagnostics.length > 0) {
        const details = validationDiagnostics.map((d) => d.message).join("; ");
        return [
          options,
          [
            createDiagnostic({
              code: "invalid-rule-options",
              format: { ruleName: rule.id, details },
              target: NoTarget,
            }),
          ],
        ];
      }
    }

    return [options, []];
  }
}

function createJSONSchemaValidatorForRuleOptions(schema: Record<string, unknown>) {
  return createJSONSchemaValidator(schema as any, { strict: false });
}

export function createLinterRuleContext<
  N extends string,
  DM extends DiagnosticMessages,
  Options extends Record<string, unknown>,
>(
  program: Program,
  rule: LinterRule<N, DM, Options>,
  options: Options,
  diagnosticCollector: DiagnosticCollector,
): LinterRuleContext<DM, Options> {
  return {
    program,
    options,
    reportDiagnostic,
  };

  function createDiagnostic<M extends keyof DM>(
    diag: LinterRuleDiagnosticReport<DM, M>,
  ): Diagnostic {
    const message = rule.messages[diag.messageId ?? "default"];
    if (!message) {
      const messageString = Object.keys(rule.messages)
        .map((x) => ` - ${x}`)
        .join("\n");
      const messageId = String(diag.messageId);
      throw new Error(
        `Unexpected message id '${messageId}' for rule '${rule.name}'. Defined messages:\n${messageString}`,
      );
    }

    const messageStr = typeof message === "string" ? message : message((diag as any).format);

    return {
      code: rule.id,
      severity: rule.severity,
      message: messageStr,
      target: diag.target,
      url: rule.url,
      codefixes: diag.codefixes,
    };
  }

  function reportDiagnostic<M extends keyof DM>(diag: LinterRuleDiagnosticReport<DM, M>): void {
    const diagnostic = createDiagnostic(diag);
    if (diagnostic.target === NoTarget) return;

    const target = resolveUserOwnedTarget(program, diagnostic.target);
    if (target !== undefined) {
      diagnosticCollector.add({ ...diagnostic, target });
    }
  }
}

/**
 * Linter rules should only report on code the user is able to act on.
 *
 * A target declared in the user project is reported as is. A target declared in a library
 * is reported only when its type is a template argument the user supplied: given
 * `model Wrapper<T> { value: T }`, `Wrapper<uuid>.value` exists in that shape only because
 * the user chose `uuid`, while everything else `Wrapper<T>` declares is authored by the
 * library and cannot be changed by them.
 *
 * The diagnostic is then reported on the argument in the user's own file, which is the
 * code they can actually change.
 *
 * See https://github.com/microsoft/typespec/issues/11861
 */
function resolveUserOwnedTarget(
  program: Program,
  target: DiagnosticTarget,
): DiagnosticTarget | undefined {
  if (getLocationContext(program, target).type === "project") {
    return target;
  }
  return findUserSuppliedArgumentNode(program, target);
}

/**
 * Resolve the node of the template argument the given target's type was built from, as
 * written in the user project. Returns `undefined` when the target isn't attributable to
 * an argument the user wrote, which includes arguments left to their default value.
 */
function findUserSuppliedArgumentNode(
  program: Program,
  target: DiagnosticTarget,
): Node | undefined {
  if (typeof target !== "object" || !("kind" in target)) return undefined;
  // Only members carry a type the user could have supplied. A whole instantiated model or
  // operation is a library declaration, and reporting on it would duplicate the diagnostic
  // already reported on the user's own `is`/`extends`/property declaration.
  if (target.kind !== "ModelProperty" && target.kind !== "UnionVariant") return undefined;
  if (target.node === undefined) return undefined;

  // Members are linked to the mapper of the template they were instantiated with, even
  // though `TemplatedTypeBase` is not part of their public type.
  const mapper = (target as { templateMapper?: TypeMapper }).templateMapper;
  if (mapper === undefined) return undefined;

  const parameter = findTemplateParameterInDeclaredType(program, target.node);
  if (parameter === undefined) return undefined;

  const node = getTemplateArgumentNode(mapper.source.node, parameter);
  return node && getLocationContext(program, node).type === "project" ? node : undefined;
}

/**
 * Resolve the member as declared, with its template parameters unsubstituted, and find the
 * parameter its type is built from. Looking at the declaration rather than comparing the
 * instantiated type to the arguments avoids matching a type the library declared itself
 * that merely happens to be the same as an argument, such as `string`.
 */
function findTemplateParameterInDeclaredType(
  program: Program,
  node: Node,
): TemplateParameter | undefined {
  const declared = program.checker.getTypeForNode(node);
  if (declared.kind !== "ModelProperty" && declared.kind !== "UnionVariant") return undefined;
  return findTemplateParameter(declared.type);
}

/** Find the template parameter a type is built from, looking through instantiations so `T[]` matches `T`. */
function findTemplateParameter(
  type: Type,
  visited = new Set<Type>(),
): TemplateParameter | undefined {
  if (visited.has(type)) return undefined;
  visited.add(type);

  if (type.kind === "TemplateParameter") return type;

  const mapper = (type as { templateMapper?: TypeMapper }).templateMapper;
  for (const argument of mapper?.args ?? []) {
    if (typeof argument === "object" && "kind" in argument) {
      const found = findTemplateParameter(argument as Type, visited);
      if (found) return found;
    }
  }
  return undefined;
}

/** Resolve the argument passed for `parameter` in a template reference, by name or by position. */
function getTemplateArgumentNode(source: Node, parameter: TemplateParameter): Node | undefined {
  if (source.kind !== SyntaxKind.TypeReference) return undefined;
  const args = source.arguments;

  const name = parameter.node.id.sv;
  const named = args.find((arg) => arg.name?.sv === name);
  if (named) return named.argument;

  const declaration = parameter.node.parent;
  const index = declaration?.templateParameters?.indexOf(parameter.node) ?? -1;
  const positional = index === -1 ? undefined : args[index];
  return positional?.name === undefined ? positional?.argument : undefined;
}

export const builtInLinterLibraryName = `@typespec/compiler`;
export function createBuiltInLinterLibrary(): LinterLibraryInstance {
  const builtInLinter: LinterResolvedDefinition = resolveLinterDefinition(
    builtInLinterLibraryName,
    createBuiltInLinter(),
  );
  return { linter: builtInLinter };
}
function createBuiltInLinter(): LinterDefinition {
  const unusedUsingLinterRule = createUnusedUsingLinterRule();
  const unusedTemplateParameterLinterRule = createUnusedTemplateParameterLinterRule();

  return defineLinter({
    rules: [unusedUsingLinterRule, unusedTemplateParameterLinterRule],
  });
}
