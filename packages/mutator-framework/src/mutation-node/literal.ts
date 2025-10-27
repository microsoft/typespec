import type { BooleanLiteral, NumericLiteral, StringLiteral } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

export class LiteralMutationNode extends MutationNode<
  StringLiteral | NumericLiteral | BooleanLiteral
> {
  readonly kind = "Literal";

  traverse() {}
}
