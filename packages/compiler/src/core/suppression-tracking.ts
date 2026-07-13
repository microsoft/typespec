import { defineCodeFix, getSourceLocation } from "./diagnostics.js";
import { builtInLinterLibraryName } from "./linter.js";
import { compilerDiagnosticCodes } from "./messages.js";
import { visitChildren } from "./parser.js";
import { SourceResolution } from "./source-loader.js";
import {
  CodeFix,
  Directive,
  DirectiveExpressionNode,
  Node,
  SuppressDirective,
  SyntaxKind,
} from "./types.js";

export interface UnusedSuppression {
  directive: SuppressDirective;
}

export interface DuplicateSuppression {
  directive: SuppressDirective;
}

export interface SuppressionTracker {
  markUsed(directiveNode: DirectiveExpressionNode): void;
  getUnusedSuppressions(): UnusedSuppression[];
}

export function createSuppressionTracker(sourceResolution: SourceResolution): SuppressionTracker {
  const suppressions = collectSuppressions(sourceResolution);

  return {
    markUsed(directiveNode) {
      const suppression = suppressions.get(directiveNode);
      if (suppression) {
        suppression.used = true;
      }
    },
    getUnusedSuppressions() {
      const unused: UnusedSuppression[] = [];
      for (const suppression of suppressions.values()) {
        if (suppression.used) {
          continue;
        }

        const availability = getSuppressionSourceAvailability(
          suppression.directive.code,
          sourceResolution,
        );
        if (availability === "unavailable") {
          continue;
        }

        unused.push({ directive: suppression.directive });
      }
      return unused;
    },
  };
}

export function findDuplicateSuppressions(
  sourceResolution: SourceResolution,
): DuplicateSuppression[] {
  const duplicates: DuplicateSuppression[] = [];
  for (const script of sourceResolution.sourceFiles.values()) {
    if (sourceResolution.locationContexts.get(script.file)?.type !== "project") {
      continue;
    }

    visit(script);
  }

  return duplicates;

  function visit(node: Node) {
    const seenSuppressions = new Set<string>();
    for (const directiveNode of node.directives ?? []) {
      const directive = parseDirective(directiveNode);
      if (directive?.name !== "suppress") {
        continue;
      }

      if (seenSuppressions.has(directive.code)) {
        duplicates.push({ directive });
        continue;
      }

      seenSuppressions.add(directive.code);
    }

    visitChildren(node, visit);
  }
}

interface SuppressionRecord {
  directive: SuppressDirective;
  used: boolean;
}

function collectSuppressions(
  sourceResolution: SourceResolution,
): Map<DirectiveExpressionNode, SuppressionRecord> {
  const suppressions = new Map<DirectiveExpressionNode, SuppressionRecord>();
  for (const script of sourceResolution.sourceFiles.values()) {
    if (sourceResolution.locationContexts.get(script.file)?.type !== "project") {
      continue;
    }

    visit(script);
  }

  return suppressions;

  function visit(node: Node) {
    for (const directiveNode of node.directives ?? []) {
      const directive = parseDirective(directiveNode);
      if (directive?.name === "suppress") {
        suppressions.set(directive.node, { directive, used: false });
      }
    }

    visitChildren(node, visit);
  }
}

function getSuppressionSourceAvailability(
  code: string,
  sourceResolution: SourceResolution,
): "available" | "unavailable" {
  if (
    compilerDiagnosticCodes.has(code) ||
    matchesDiagnosticSource(code, builtInLinterLibraryName)
  ) {
    return "available";
  }

  for (const libraryName of sourceResolution.loadedLibraries.keys()) {
    if (matchesDiagnosticSource(code, libraryName)) {
      return "available";
    }
  }

  return "unavailable";
}

function matchesDiagnosticSource(code: string, source: string): boolean {
  return code.startsWith(`${source}/`);
}

export function findDirectiveSuppressingOnNode(code: string, node: Node): Directive | undefined {
  let current: Node | undefined = node;
  do {
    if (current.directives) {
      const directive = findDirectiveSuppressingCode(code, current.directives);
      if (directive) {
        return directive;
      }
    }
  } while ((current = current.parent));
  return undefined;
}

/**
 * Returns the directive node that is suppressing this code.
 * @param code Code to check for suppression.
 * @param directives List of directives.
 * @returns Directive suppressing this code if found, `undefined` otherwise
 */
export function findDirectiveSuppressingCode(
  code: string,
  directives: readonly DirectiveExpressionNode[],
): Directive | undefined {
  for (const directiveNode of directives) {
    const directive = parseDirective(directiveNode);
    if (directive?.name === "suppress") {
      if (directive.code === code) {
        return directive;
      }
    }
  }
  return undefined;
}

export function parseDirective(node: DirectiveExpressionNode): Directive | undefined {
  const args = node.arguments.map((x) => {
    return x.kind === SyntaxKind.Identifier ? x.sv : x.value;
  });
  switch (node.target.sv) {
    case "suppress":
      if (typeof args[0] !== "string") {
        return undefined;
      }
      return { name: "suppress", code: args[0], message: args[1] ?? "", node };
    case "deprecated":
      if (typeof args[0] !== "string") {
        return undefined;
      }
      return { name: "deprecated", message: args[0], node };
    default:
      return undefined;
  }
}

export function createRemoveUnusedSuppressionCodeFix(node: DirectiveExpressionNode): CodeFix {
  return defineCodeFix({
    id: "remove-unused-suppression",
    label: "Remove unused suppression",
    fix: (context) => {
      const location = getSourceLocation(node);
      const text = location.file.text;
      const lineStart = text.lastIndexOf("\n", location.pos - 1) + 1;
      const textBeforeDirective = text.slice(lineStart, location.pos);

      if (textBeforeDirective.trim() !== "") {
        return context.replaceText(location, "");
      }

      let end = location.end;
      while (end < text.length && (text[end] === " " || text[end] === "\t")) {
        end++;
      }
      if (text[end] === "\r" && text[end + 1] === "\n") {
        end += 2;
      } else if (text[end] === "\n" || text[end] === "\r") {
        end++;
      }

      return context.replaceText({ ...location, pos: lineStart, end }, "");
    },
  });
}
