import { isPromise } from "../utils/misc.js";
import { DiagnosticCollector, compilerAssert, createDiagnosticCollector } from "./diagnostics.js";
import { getLocationContext } from "./helpers/location-context.js";
import { defineLinter } from "./library.js";
import { createUnusedTemplateParameterLinterRule } from "./linter-rules/unused-template-parameter.rule.js";
import { createUnusedUsingLinterRule } from "./linter-rules/unused-using.rule.js";
import { createDiagnostic } from "./messages.js";
import { NameResolver } from "./name-resolver.js";
import type { Program } from "./program.js";
import { EventEmitter, mapEventEmitterToNodeListener, navigateProgram } from "./semantic-walker.js";
import { startTimer } from "./stats.js";
import {
  Diagnostic,
  DiagnosticMessages,
  LinterDefinition,
  LinterResolvedDefinition,
  LinterRule,
  LinterRuleContext,
  LinterRuleDiagnosticReport,
  LinterRuleSet,
  NoTarget,
  RuleRef,
  SemanticNodeListener,
} from "./types.js";

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
): Linter {
  const tracer = program.tracer.sub("linter");

  const ruleMap = new Map<string, LinterRule<string, any>>();
  const enabledRules = new Map<string, LinterRule<string, any>>();
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
        const ref = diagnostics.pipe(parseRuleReference(extendingRuleSetName));
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
      for (const [ruleName, enable] of Object.entries(ruleSet.enable)) {
        if (enable === false) {
          continue;
        }
        const ref = diagnostics.pipe(parseRuleReference(ruleName as RuleRef));
        if (ref) {
          await resolveLibrary(ref.libraryName);
          const rule = ruleMap.get(ruleName);
          if (rule) {
            enabledInThisRuleSet.add(ruleName);
            enabledRules.set(ruleName, rule);
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
      for (const ruleName of Object.keys(ruleSet.disable)) {
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
    const diagnostics = createDiagnosticCollector();
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    const stats: LinterStats = {
      runtime: {
        total: 0,
        rules: {},
      },
    };
    tracer.trace(
      "lint",
      `Running linter with following rules:\n` +
        [...enabledRules.keys()].map((x) => ` - ${x}`).join("\n"),
    );

    const timer = startTimer();
    // We can't rely on semantic walker to wait-all because event emitter won't return result to semantic walker (we need to to hook multiple callback to one event).
    // So we need to track all promises returned by each rule and await them after navigation explicitly here to make sure they can run in parallel as well as be awaited properly after navigation.
    const promisesMap: Map<LinterRule<string, any>, Promise<any>[]> = new Map();
    for (const rule of enabledRules.values()) {
      const createTiming = startTimer();
      const listener = rule.create(createLinterRuleContext(program, rule, diagnostics));
      stats.runtime.rules[rule.id] = createTiming.end();
      const promises: Promise<any>[] = [];
      promisesMap.set(rule, promises);
      for (const [name, cb] of Object.entries(listener)) {
        const timedCb = (...args: any[]) => {
          const timer = startTimer();
          const result = (cb as any)(...args);
          if (isPromise(result)) {
            const rr = result.then(() => {
              const duration = timer.end();
              stats.runtime.rules[rule.id] += duration;
            });
            promises.push(rr);
          } else {
            const duration = timer.end();
            stats.runtime.rules[rule.id] += duration;
          }
        };
        eventEmitter.on(name as any, timedCb);
      }
    }
    await navigateProgram(program, mapEventEmitterToNodeListener(eventEmitter), {
      // set to await-all so that semantic walker won't block, but needs to handle the promises ourselves as explained above.
      asyncMode: "await-all",
    });
    for (const ps of promisesMap.values()) {
      await Promise.all(ps);
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
}

export function createLinterRuleContext<N extends string, DM extends DiagnosticMessages>(
  program: Program,
  rule: LinterRule<N, DM>,
  diagnosticCollector: DiagnosticCollector,
): LinterRuleContext<DM> {
  return {
    program,
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
    if (diagnostic.target !== NoTarget) {
      const context = getLocationContext(program, diagnostic.target);
      // Only report diagnostic in the user project.
      // See for showing diagnostic in library at point of usage https://github.com/microsoft/typespec/issues/1997
      if (context.type === "project") {
        diagnosticCollector.add(diagnostic);
      }
    }
  }
}

export const builtInLinterLibraryName = `@typespec/compiler`;
export function createBuiltInLinterLibrary(nameResolver: NameResolver): LinterLibraryInstance {
  const builtInLinter: LinterResolvedDefinition = resolveLinterDefinition(
    builtInLinterLibraryName,
    createBuiltInLinter(nameResolver),
  );
  return { linter: builtInLinter };
}
function createBuiltInLinter(nameResolver: NameResolver): LinterDefinition {
  const unusedUsingLinterRule = createUnusedUsingLinterRule(nameResolver);

  const unusedTemplateParameterLinterRule = createUnusedTemplateParameterLinterRule();

  return defineLinter({
    rules: [unusedUsingLinterRule, unusedTemplateParameterLinterRule],
  });
}
