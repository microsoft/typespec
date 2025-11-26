import type { Enum, EnumMember } from "@typespec/compiler";
import type { EnumMutationNode } from "./enum.js";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class EnumMemberMutationNode extends MutationNode<EnumMember> {
  readonly kind = "EnumMember";

  startEnumEdge() {
    return new HalfEdge<EnumMember, Enum>(this, {
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType.enum = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: () => {
        this.delete();
      },
    });
  }

  connectEnum(enumNode: EnumMutationNode) {
    this.startEnumEdge().setTail(enumNode);
  }
}
