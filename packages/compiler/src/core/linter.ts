import { createDiagnosticCollector } from "./diagnostics.js";
import { createDiagnostic } from "./messages.js";
import { Library, Program } from "./program.js";
import { Diagnostic, LinterRuleDefinition, LinterRuleSet, NoTarget, RuleRef } from "./types.js";

export interface Linter {
  extendRuleSet(ruleSet: LinterRuleSet): Promise<readonly Diagnostic[]>;
}

export function createLinter(
  program: Program,
  loadLibrary: (name: string) => Promise<Library | undefined>
): Linter {
  // TODO document tracing options
  const tracer = program.tracer.sub("linter");

  const ruleMap = new Map<string, LinterRuleDefinition<string, any>>();
  const enabledRules = new Map<string, LinterRuleDefinition<string, any>>();
  const linterLibraries = new Map<string, Library | undefined>();

  return {
    extendRuleSet,
  };

  async function resolveLibrary(name: string): Promise<Library | undefined> {
    let loadedLibrary = linterLibraries.get(name);
    if (loadedLibrary === undefined) {
      loadedLibrary = await loadLibrary(name);
      if (loadedLibrary?.definition?.linter?.rules) {
        for (const rule of loadedLibrary.definition.linter.rules) {
          ruleMap.set(`${name}:${rule.name}`, rule);
        }
      }
      linterLibraries.set(name, loadedLibrary);
    }
    return loadedLibrary;
  }

  async function extendRuleSet(ruleSet: LinterRuleSet): Promise<readonly Diagnostic[]> {
    tracer.trace("extend-rule-set.start", JSON.stringify(ruleSet, null, 2));
    const diagnostics = createDiagnosticCollector();
    if (ruleSet.extends) {
      for (const extendingRuleSetName of ruleSet.extends) {
        const ref = diagnostics.pipe(parseRuleReference(extendingRuleSetName));
        if (ref) {
          const library = await resolveLibrary(ref.libraryName);
          const extendingRuleSet = library?.definition?.linter?.ruleSets?.[ref.name];
          if (extendingRuleSet) {
            await extendRuleSet(extendingRuleSet);
          } else {
            diagnostics.add(
              createDiagnostic({
                code: "unknown-rule-set",
                format: { libraryName: ref.libraryName, ruleSetName: ref.name },
                target: NoTarget,
              })
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
                code: "unknown-rule-set",
                format: { libraryName: ref.libraryName, ruleSetName: ref.name },
                target: NoTarget,
              })
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
            })
          );
        }
        enabledRules.delete(ruleName);
      }
    }
    tracer.trace(
      "extend-rule-set.end",
      "Rules enabled: \n" + [...enabledRules.keys()].map((x) => ` - ${x}`).join("\n")
    );

    return diagnostics.diagnostics;
  }

  function parseRuleReference(
    ref: RuleRef
  ): [{ libraryName: string; name: string } | undefined, readonly Diagnostic[]] {
    const [libraryName, name] = ref.split(":");
    if (!libraryName || !name) {
      return [
        undefined,
        [createDiagnostic({ code: "invalid-rule-ref", format: { ref }, target: NoTarget })],
      ];
    }
    return [{ libraryName, name }, []];
  }
}
