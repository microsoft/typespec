import {
  compilerAssert,
  EventEmitter,
  mapEventEmitterToNodeListener,
  navigateProgram,
  Program,
  SemanticNodeListener,
  TypeSpecLibrary,
} from "@typespec/compiler";
import { LibraryLinter, Linter, LintRule, RegisterRuleOptions } from "./types.js";

export function getLinter(library: TypeSpecLibrary<any, any>): LibraryLinter {
  const linter = createLinter();
  return getLinterForLibrary(linter, library);
}

function getLinterForLibrary(linter: Linter, library: TypeSpecLibrary<any, any>): LibraryLinter {
  const rulesToAutoEnable: string[] = [];
  return {
    ...linter,
    autoEnableRules,
    registerRule,
    registerRules(rules: LintRule[], options?: RegisterRuleOptions) {
      for (const rule of rules) {
        registerRule(rule, options);
      }
    },
  };

  function registerRule(rule: LintRule, options?: RegisterRuleOptions) {
    const name = `${library.name}/${rule.name}`;
    linter.registerRule({
      ...rule,
      name,
    });
    if (options?.autoEnable) {
      rulesToAutoEnable.push(name);
    }
  }

  function autoEnableRules() {
    linter.enableRules(rulesToAutoEnable);
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
    lintProgram,
  };
  ``;

  function lintOnValidate(program: Program) {
    if (program.compilerOptions.miscOptions?.["disable-linter"]) {
      return;
    }
    if (!programRegistered.has(program)) {
      program.onValidate(lintProgram);
      programRegistered.add(program);
    }
  }

  function lintProgram(program: Program) {
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    const tracer = getTracer(program);
    tracer.trace(
      "run",
      [`Running linter with following rules:`, ...[...enabledRules].map((x) => ` - ${x}`)].join(
        "\n"
      )
    );
    for (const ruleName of enabledRules) {
      const rule = ruleMap.get(ruleName);
      compilerAssert(rule, `Rule with name ${ruleName} was requested but was not found.`);
      const listener = rule.create({ program });
      for (const [name, cb] of Object.entries(listener)) {
        eventEmitter.on(name as any, cb as any);
      }
    }
    navigateProgram(program, mapEventEmitterToNodeListener(eventEmitter));
  }

  function registerRule(rule: LintRule) {
    compilerAssert(
      !ruleMap.has(rule.name),
      `Rule "${rule.name}" is already registered. Make sure to give unique names.`
    );

    ruleMap.set(rule.name, rule);
  }

  function registerRules(rules: LintRule[]) {
    for (const rule of rules) {
      registerRule(rule);
    }
  }

  function enableRule(name: string) {
    if (!ruleMap.has(name)) {
      throw new Error(`Rule "${name}" is not registered. Cannot enable.`);
    }
    enabledRules.add(name);
  }

  function enableRules(names: string[]) {
    for (const name of names) {
      enableRule(name);
    }
  }
}

export function createRule(rule: LintRule): LintRule {
  return rule;
}

function getTracer(program: Program) {
  return program.tracer.sub("@typespec/lint");
}
