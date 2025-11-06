import type { IntrinsicType } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

export class IntrinsicMutationNode extends MutationNode<IntrinsicType> {
  readonly kind = "Intrinsic";

  traverse() {}
}
