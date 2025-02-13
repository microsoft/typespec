import { removeUnusedCodeCodeFix } from "./compiler-code-fixes/remove-unused-code.codefix.js";
import { DiagnosticCollector, compilerAssert, createDiagnosticCollector } from "./diagnostics.js";
import { getLocationContext } from "./helpers/location-context.js";
import { createLinterRule, defineLinter, paramMessage } from "./library.js";
import { createDiagnostic } from "./messages.js";
import { NameResolver } from "./name-resolver.js";
import type { Program } from "./program.js";
import { EventEmitter, mapEventEmitterToNodeListener, navigateProgram } from "./semantic-walker.js";
import {
  Diagnostic,
  DiagnosticMessages,
  IdentifierNode,
  LinterDefinition,
  LinterResolvedDefinition,
  LinterRule,
  LinterRuleContext,
  LinterRuleDiagnosticReport,
  LinterRuleSet,
  MemberExpressionNode,
  NoTarget,
  RuleRef,
  SemanticNodeListener,
  SyntaxKind,
} from "./types.js";

type LinterLibraryInstance = { linter: LinterResolvedDefinition };

export interface Linter {
  extendRuleSet(ruleSet: LinterRuleSet): Promise<readonly Diagnostic[]>;
  lint(): readonly Diagnostic[];
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
  nameResolver: NameResolver,
  loadLibrary: (name: string) => Promise<LinterLibraryInstance | undefined>,
): Linter {
  const tracer = program.tracer.sub("linter");

  const ruleMap = new Map<string, LinterRule<string, any>>();
  const enabledRules = new Map<string, LinterRule<string, any>>();
  const linterLibraries = new Map<string, LinterLibraryInstance | undefined>();
  const builtInLinter: LinterResolvedDefinition = resolveLinterDefinition(
    builtInLinterLibraryName,
    createDefaultLinter(nameResolver),
  );

  return {
    extendRuleSet,
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

  function lint(): readonly Diagnostic[] {
    const diagnostics = createDiagnosticCollector();
    const eventEmitter = new EventEmitter<SemanticNodeListener>();
    tracer.trace(
      "lint",
      `Running linter with following rules:\n` +
        [...enabledRules.keys()].map((x) => ` - ${x}`).join("\n"),
    );

    for (const rule of enabledRules.values()) {
      const listener = rule.create(createLinterRuleContext(program, rule, diagnostics));
      for (const [name, cb] of Object.entries(listener)) {
        eventEmitter.on(name as any, cb as any);
      }
    }
    navigateProgram(program, mapEventEmitterToNodeListener(eventEmitter));
    return diagnostics.diagnostics;
  }

  async function resolveLibrary(name: string): Promise<LinterLibraryInstance | undefined> {
    const loadedLibrary = linterLibraries.get(name);
    if (loadedLibrary === undefined) {
      return registerLinterLibrary(name);
    }
    return loadedLibrary;
  }

  async function registerLinterLibrary(name: string): Promise<LinterLibraryInstance | undefined> {
    tracer.trace("register-library", name);

    const library =
      name === builtInLinterLibraryName ? { linter: builtInLinter } : await loadLibrary(name);
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
export const builtInLinterRule_UnusedUsing = `unused-using`;
function createDefaultLinter(nameResolver: NameResolver): LinterDefinition {
  const unusedUsingLinterRule = createUnusedUsingLinterRule();

  return defineLinter({
    rules: [unusedUsingLinterRule],
  });

  function createUnusedUsingLinterRule() {
    return createLinterRule({
      name: builtInLinterRule_UnusedUsing,
      severity: "warning",
      description: "Linter rules for unused using statement.",
      messages: {
        default: paramMessage`'using ${"code"}' is declared but never be used.`,
      },
      create(context) {
        return {
          root: (_root) => {
            const getUsingName = (node: MemberExpressionNode | IdentifierNode): string => {
              if (node.kind === SyntaxKind.MemberExpression) {
                return `${getUsingName(node.base)}${node.selector}${node.id.sv}`;
              } else {
                // identifier node
                return node.sv;
              }
            };
            nameResolver.getUnusedUsings().forEach((target) => {
              context.reportDiagnostic({
                messageId: "default",
                format: { code: getUsingName(target.name) },
                target,
                codefixes: [removeUnusedCodeCodeFix(target)],
              });
            });
          },
        };
      },
    });
  }
}
