import type { MutationEdge } from "./mutation-edge.js";
import type { MutationNode } from "./mutation-node.js";

/**
 * Useful tracing utilities to help debug mutation graphs.
 */
const shouldTrace = false;
export function traceNode(node: MutationNode<any>, message: string = ""): void {
  if (!shouldTrace) return;
  // eslint-disable-next-line no-console
  console.log(`${node}\n  ${message}`);
}

export function traceEdge(edge: MutationEdge<any, any>, message: string = ""): void {
  if (!shouldTrace) return;
  // eslint-disable-next-line no-console
  console.log(`${edge}\n  ${message}`);
}
