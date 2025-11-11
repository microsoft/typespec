import type { Enum, EnumMember } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class EnumMutationNode extends MutationNode<Enum> {
  readonly kind = "Enum";

  startMemberEdge() {
    return new HalfEdge<Enum, EnumMember>(this, {
      onTailCreation: (tail) => {
        tail.connectEnum(this);
      },
      onTailMutation: (tail) => {
        this.mutate();
        this.mutatedType.members.delete(tail.sourceType.name);
        this.mutatedType.members.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: (tail) => {
        this.mutate();
        this.mutatedType.members.delete(tail.sourceType.name);
      },
      onTailReplaced: (tail, newTail) => {
        if (newTail.mutatedType.kind !== "EnumMember") {
          throw new Error("Cannot replace enum member with non-enum member type");
        }
        this.mutate();
        this.mutatedType.members.delete(tail.sourceType.name);
        this.mutatedType.members.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }

  connectMember(memberNode: MutationNode<EnumMember>) {
    this.startMemberEdge().setTail(memberNode);
  }
}
