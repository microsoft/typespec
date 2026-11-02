import type { Enum, EnumMember } from "@typespec/compiler";
import type { EnumMutationNode } from "./enum.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Tracks an enum member's output and its explicitly connected containing enum. */
export class EnumMemberMutationNode extends MutationNode<EnumMember> {
  /** Selects enum-member ownership connections. */
  readonly kind = "EnumMember";

  /**
   * Starts the containing-enum back-reference.
   * Enum mutation updates the output's owner; enum deletion or replacement
   * deletes this member rather than moving it to a different enum.
   */
  startEnumEdge() {
    return new HalfEdge<EnumMember, Enum>(this, {
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.enum = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: ({ head }) => {
        head.delete();
      },
    });
  }

  /** Completes {@link startEnumEdge}; normally established by an enum's member connection. */
  connectEnum(enumNode: EnumMutationNode) {
    this.startEnumEdge().setTail(enumNode);
  }
}
