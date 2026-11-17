import type { BooleanLiteral, NumericLiteral, StringLiteral } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

/** Leaf node for literal outputs, with no child reference edges to establish. */
export class LiteralMutationNode extends MutationNode<
  StringLiteral | NumericLiteral | BooleanLiteral
> {
  /** Groups string, numeric, and boolean literal nodes under one connection kind. */
  readonly kind = "Literal";

  /** Completes the leaf's connection phase without creating edges; repeated calls do nothing. */
  connect() {
    if (this.connected) return;
    this.connected = true;
  }
}
