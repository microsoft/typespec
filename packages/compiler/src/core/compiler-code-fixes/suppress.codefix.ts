import { defineCodeFix, getNodeForTarget, getSourceLocation } from "../diagnostics.js";
import {
  Diagnostic,
  NoTarget,
  SyntaxKind,
  type CodeFix,
  type DiagnosticTarget,
  type Node,
  type SourceLocation,
} from "../types.js";
import { findLineStartAndIndent } from "./utils.js";

/**
 * A polyfill for Map.groupBy for environments that do not support it yet.
 * Mostly for Node.js versions prior to 21.
 * This method can be removed once we drop support for Node.js versions that do not support it.
 */
const mapGroupBy: typeof Map.groupBy =
  (Map as { groupBy?: typeof Map.groupBy }).groupBy ??
  ((items, keyFn) => {
    const result = new Map<any, any[]>();
    let index = 0;
    for (const item of items) {
      const key = keyFn(item, index++);
      const group = result.get(key);
      if (group) {
        group.push(item);
      } else {
        result.set(key, [item]);
      }
    }
    return result;
  });

export function createSuppressCodeFix(
  diagnosticTarget: DiagnosticTarget,
  warningCode: string,
  suppressionMessage: string = "",
): CodeFix {
  return defineCodeFix({
    id: "suppress",
    label: `Suppress warning: "${warningCode}"`,
    fix: (context) => {
      const location = findSuppressTarget(diagnosticTarget);
      if (!location) {
        return undefined;
      }
      const { lineStart, indent } = findLineStartAndIndent(location);
      const updatedLocation = { ...location, pos: lineStart };
      return context.prependText(
        updatedLocation,
        `${indent}#suppress "${warningCode}" "${suppressionMessage}"\n`,
      );
    },
  });
}
/**
 * Create code fixes to suppress the given diagnostics.
 * This function groups diagnostics by their suppression target to avoid duplicate suppressions.
 * @param diagnostics The diagnostics to suppress.
 * @param suppressionMessage The suppression message to use.
 * @returns An array of code fixes to apply the suppressions.
 */
export function createSuppressCodeFixes(
  diagnostics: readonly Diagnostic[],
  suppressionMessage: string = "",
): readonly CodeFix[] {
  return Array.from(
    Array.from(
      mapGroupBy(
        diagnostics
          .filter((diag) => diag.severity === "warning" && diag.target !== NoTarget)
          .map((diag) => {
            const suppressTarget = findSuppressTarget(diag.target as DiagnosticTarget);
            return suppressTarget === undefined
              ? undefined
              : {
                  groupingKey: `${diag.code}-${suppressTarget.file.path}-${suppressTarget.pos}-${suppressTarget.end}`,
                  fix: createSuppressCodeFix(
                    diag.target as DiagnosticTarget,
                    diag.code,
                    suppressionMessage,
                  ),
                };
          })
          .filter((fix) => fix !== undefined),
        (fix) => fix.groupingKey,
      ).entries(),
    ).map((group) => group[1][0].fix),
  );
}

function findSuppressTarget(target: DiagnosticTarget): SourceLocation | undefined {
  if ("file" in target) {
    return target;
  }

  const nodeTarget = getNodeForTarget(target);
  if (!nodeTarget) return undefined;

  const node = findSuppressNode(nodeTarget);
  return getSourceLocation(node);
}

/** Find the node where the suppression should be applied */
function findSuppressNode(node: Node): Node {
  switch (node.kind) {
    case SyntaxKind.Identifier:
    case SyntaxKind.TypeReference:
    case SyntaxKind.UnionExpression:
    case SyntaxKind.ModelExpression:
    case SyntaxKind.ArrayExpression:
    case SyntaxKind.TupleExpression:
    case SyntaxKind.TypeOfExpression:
    case SyntaxKind.CallExpression:
    case SyntaxKind.MemberExpression:
    case SyntaxKind.IntersectionExpression:
    case SyntaxKind.StringTemplateExpression:
    case SyntaxKind.StringTemplateHead:
    case SyntaxKind.StringTemplateSpan:
    case SyntaxKind.StringTemplateTail:
    case SyntaxKind.StringTemplateMiddle:
      return findSuppressNode(node.parent!);
    default:
      return node;
  }
}
