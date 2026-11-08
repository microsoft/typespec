import type { IntrinsicType } from "@typespec/compiler";
import { MutationNode } from "./mutation-node.js";

/** Leaf node for compiler intrinsic outputs, with no child reference edges to establish. */
export class IntrinsicMutationNode extends MutationNode<IntrinsicType> {
  /** Identifies intrinsic nodes independently of the particular intrinsic's name. */
  readonly kind = "Intrinsic";

  /** Completes the leaf's connection phase without creating edges; repeated calls do nothing. */
  connect() {
    if (this.connected) return;
    this.connected = true;
  }
}
