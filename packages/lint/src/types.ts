import { Program, SemanticNodeListener } from "@typespec/compiler";

export interface RegisterRuleOptions {
  /**
   * Allows a rule to be automatically enabled when `autoEnableRules` is called.
   */
  autoEnable?: boolean;
}

export interface Linter {
  /**
   * Register a new rule.
   * @param rule Rule to register.
   */
  registerRule(rule: LintRule): void;
  /**
   * Register a new set of rules.
   * @param rule Rule to register.
   */
  registerRules(rules: LintRule[]): void;

  /**
   * Enable the rule with the given name.
   */
  enableRule(name: string): void;

  /**
   * Enable the rules with the given names.
   */
  enableRules(names: string[]): void;

  /**
   * Register the linter for this program.
   * Doesn't lint immediately. Register the linter as a `onValidate` step.
   * @param program Program.
   */
  lintOnValidate(program: Program): void;

  /**
   * @internal
   * Lint the given program, adding diagnostics.
   * @param program Program to lint
   */
  lintProgram(program: Program): void;
}

export interface LibraryLinter extends Linter {
  /**
   * Register a new rule.
   * @param rule Rule to register.
   */
  registerRule(rule: LintRule, options?: RegisterRuleOptions): void;
  /**
   * Register a new set of rules.
   * @param rule Rule to register.
   */
  registerRules(rules: LintRule[], options?: RegisterRuleOptions): void;

  /**
   * Automatically enable the rules marked with auto enable
   */
  autoEnableRules(): void;
}

export interface LintRule {
  name: string;
  create(context: LintContext): SemanticNodeListener;
}

export interface LintContext {
  program: Program;
}
