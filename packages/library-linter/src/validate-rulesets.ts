import {
  NoTarget,
  resolveLinterDefinition,
  type LinterResolvedDefinition,
  type LinterRuleSet,
  type Program,
} from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";

interface LoadedLinter {
  readonly libName: string;
  readonly linter: LinterResolvedDefinition;
  /** Whether this linter belongs to the library being compiled as opposed to one of its dependencies. */
  readonly isProject: boolean;
}

/**
 * Validate that every rule and ruleset referenced by the rulesets of the library being compiled
 * actually exists. Without this a dangling reference is only reported when a consumer happens to
 * extend the offending ruleset.
 */
export function validateRuleSets(program: Program) {
  const linters = collectLinters(program);
  const knownLibraries = new Set(linters.map((x) => x.libName));
  const knownRules = new Set<string>();
  const knownRuleSets = new Set<string>();
  for (const { libName, linter } of linters) {
    for (const rule of linter.rules) {
      knownRules.add(rule.id);
    }
    for (const name of Object.keys(linter.ruleSets)) {
      knownRuleSets.add(`${libName}/${name}`);
    }
  }

  for (const { libName, linter, isProject } of linters) {
    if (!isProject) continue;
    for (const [name, ruleSet] of Object.entries(linter.ruleSets)) {
      validateRuleSet(program, `${libName}/${name}`, ruleSet, {
        knownLibraries,
        knownRules,
        knownRuleSets,
      });
    }
  }
}

interface KnownReferences {
  readonly knownLibraries: ReadonlySet<string>;
  readonly knownRules: ReadonlySet<string>;
  readonly knownRuleSets: ReadonlySet<string>;
}

function validateRuleSet(
  program: Program,
  ruleSetName: string,
  ruleSet: LinterRuleSet,
  known: KnownReferences,
) {
  for (const ref of ruleSet.extends ?? []) {
    validateReference(program, ruleSetName, ref, "ruleset", known);
  }
  for (const ref of Object.keys(ruleSet.enable ?? {})) {
    validateReference(program, ruleSetName, ref, "rule", known);
  }
  for (const ref of Object.keys(ruleSet.disable ?? {})) {
    validateReference(program, ruleSetName, ref, "rule", known);
  }
}

function validateReference(
  program: Program,
  ruleSetName: string,
  ref: string,
  kind: "rule" | "ruleset",
  known: KnownReferences,
) {
  const parsed = parseReference(ref);
  if (parsed === undefined) {
    reportDiagnostic(program, {
      code: "invalid-rule-reference",
      format: { ref, ruleSetName },
      target: NoTarget,
    });
    return;
  }

  // The referenced library is not part of this compilation, so there is nothing to check against.
  // This happens when a ruleset references a library that the current library does not import.
  if (!known.knownLibraries.has(parsed.libraryName)) {
    return;
  }

  const exists = kind === "rule" ? known.knownRules.has(ref) : known.knownRuleSets.has(ref);
  if (!exists) {
    reportDiagnostic(program, {
      code: kind === "rule" ? "unknown-rule" : "unknown-rule-set",
      format: { name: parsed.name, libraryName: parsed.libraryName, ruleSetName },
      target: NoTarget,
    });
  }
}

function parseReference(ref: string): { libraryName: string; name: string } | undefined {
  const segments = ref.split("/");
  const name = segments.pop();
  const libraryName = segments.join("/");
  if (!libraryName || !name) {
    return undefined;
  }
  return { libraryName, name };
}

function collectLinters(program: Program): LoadedLinter[] {
  const linters: LoadedLinter[] = [];
  for (const jsFile of program.jsSourceFiles.values()) {
    const lib = jsFile.esmExports.$lib;
    const linter = jsFile.esmExports.$linter;
    if (linter === undefined || typeof lib?.name !== "string") {
      continue;
    }
    linters.push({
      libName: lib.name,
      linter: resolveLinterDefinition(lib.name, linter),
      isProject: program.getSourceFileLocationContext(jsFile.file).type === "project",
    });
  }
  return linters;
}
