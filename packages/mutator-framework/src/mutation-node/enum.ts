import type { Enum, EnumMember } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class EnumMutationNode extends MutationNode<Enum> {
  readonly kind = "Enum";

  traverse() {
    for (const member of this.sourceType.members.values()) {
      const memberNode = this.subgraph.getNode(member);
      this.connectMember(memberNode, member.name);
    }
  }

  connectMember(memberNode: MutationNode<EnumMember>, sourcePropName: string) {
    MutationEdge.create(this, memberNode, {
      onTailMutation: () => {
        this.mutatedType.members.delete(sourcePropName);
        this.mutatedType.members.set(memberNode.mutatedType.name, memberNode.mutatedType);
      },
      onTailDeletion: () => {
        this.mutatedType.members.delete(sourcePropName);
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "EnumMember") {
          throw new Error("Cannot replace enum member with non-enum member type");
        }
        this.mutatedType.members.delete(sourcePropName);
        this.mutatedType.members.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }
}
