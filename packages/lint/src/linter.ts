import {
  CadlLibrary,
  compilerAssert,
  EventEmitter,
  navigateProgram,
  Program,
  SemanticNodeListener,
} from "@cadl-lang/compiler";
import { Linter, LintRule, RegisterRuleOptions } from "./types.js";

export function getLinter(library: CadlLibrary<any, any>): Linter {
  const linter = getLinterSingleton();
  return getLinterForLibrary(linter, library);
}

const linterSingletonKey = Symbol.for("@cadl-lang/lint.singleton");
function getLinterSingleton(): Linter {
  let linter: Linter | undefined = (globalThis as any)[linterSingletonKey];
  if (linter === undefined) {
    linter = createLinter();
    (globalThis as any)[linterSingletonKey] = linter;
  }
  return linter;
}

function getLinterForLibrary(linter: Linter, library: CadlLibrary<any, any>): Linter {
  return {
    ...linter,
    registerRule,
    registerRules(rules: LintRule[], options?: RegisterRuleOptions) {
      for (const rule of rules) {
        registerRule(rule, options);
      }
    },
  };

  function registerRule(rule: LintRule, options?: RegisterRuleOptions) {
    linter.registerRule(
      {
        ...rule,
        name: `${library.name}/${rule.name}`,
      },
      options
    );
  }
}

function createLinter(): Linter {
  const ruleMap = new Map<string, LintRule>();
  const enabledRules = new Set<string>();
  const programRegistered = new WeakSet<Program>();
  return {
    registerRule,
    registerRules,
    enableRule,
    enableRules,
    lintOnValidate,
  };
  ``;

  function lintOnValidate(program: Program) {
    if (!programRegistered.has(program)) {
      program.onValidate(lintProgram);
      programRegistered.add(program);
    }
  }

  function lintProgram(program: Program) {
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    for (const ruleName of enabledRules) {
      const rule = ruleMap.get(ruleName);
      compilerAssert(rule, `Rule with name ${ruleName} should exists.`);
      const listener = rule.create({ program });
      for (const [name, cb] of Object.entries(listener)) {
        eventEmitter.on(name as any, cb as any);
      }
    }
    navigateProgram(program, eventEmitter);
  }

  function registerRule(rule: LintRule, options?: RegisterRuleOptions) {
    compilerAssert(
      !ruleMap.has(rule.name),
      `Rule "${rule.name}" is already registered. Make sure to give unique names.`
    );

    ruleMap.set(rule.name, rule);
    if (options?.enable) {
      enabledRules.add(rule.name);
    }
  }

  function registerRules(rules: LintRule[], options?: RegisterRuleOptions) {
    for (const rule of rules) {
      registerRule(rule, options);
    }
  }

  function enableRule(name: string) {
    compilerAssert(ruleMap.has(name), `Rule "${name}" is not registered. Cannot enable.`);
    enabledRules.add(name);
  }

  function enableRules(names: string[]) {
    for (const name of names) {
      compilerAssert(ruleMap.has(name), `Rule "${name}"  is not registered. Cannot enable.`);
      enabledRules.add(name);
    }
  }
}

export function createRule(rule: LintRule): LintRule {
  return rule;
}
