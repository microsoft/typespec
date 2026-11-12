import { getDiagnosticTemplateInstantitationTrace, getSourceLocation } from "../diagnostics.js";
import type { Program } from "../program.js";
import type { DiagnosticTarget, Node } from "../types.js";
import { getLocationContext } from "./location-context.js";

/**
 * Walk from a type up through everything that explains why it exists in the program
 * (its container, then the template instantiations it came from) and return the nodes
 * encountered, nearest first. The compiler already records this on cloned/instantiated types.
 */
export function getUsageTrace(program: Program, target: DiagnosticTarget): Node[] {
  const trace: Node[] = [];
  const seen = new Set<unknown>();
  const queue: DiagnosticTarget[] = [target];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    if (current !== target) {
      const node =
        "kind" in current && "pos" in current ? (current as Node) : (current as any).node;
      if (node) trace.push(node);
    }
    if (typeof current !== "object" || !("kind" in current) || typeof current.kind !== "string") {
      continue;
    }
    const type = current as any;
    // A type's parent: where it was spread/declared and thus used.
    const container = type.model ?? type.interface ?? type.enum ?? type.union;
    if (container) queue.push(container);
    for (const node of getDiagnosticTemplateInstantitationTrace(type)) {
      queue.push(node);
    }
  }
  return trace;
}

/** First node in the project that uses the given library target, if any. */
export function findProjectUsageSite(
  program: Program,
  target: DiagnosticTarget,
): DiagnosticTarget | undefined {
  return getUsageTrace(program, target).find(
    (x) => !getSourceLocation(x).isSynthetic && getLocationContext(program, x).type === "project",
  );
}
