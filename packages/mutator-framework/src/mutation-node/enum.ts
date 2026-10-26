import type { Enum, EnumMember } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Maintains an enum's member map through explicit member connections. */
export class EnumMutationNode extends MutationNode<Enum> {
  /** Selects enum-specific member connections. */
  readonly kind = "Enum";

  /**
   * Starts a member reference and establishes the member's enum back-reference.
   * Renames replace source-name entries, deletion removes them, and replacements
   * must remain enum members. The enum is cloned when its map needs updating.
   */
  startMemberEdge() {
    return new HalfEdge<Enum, EnumMember>(this, {
      onTailCreation: ({ tail }) => {
        tail.connectEnum(this);
      },
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.members.delete(tail.sourceType.name);
        this.mutatedType.members.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: ({ tail }) => {
        this.mutate();
        this.mutatedType.members.delete(tail.sourceType.name);
      },
      onTailReplaced: ({ oldTail, newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "EnumMember") {
          throw new Error("Cannot replace enum member with non-enum member type");
        }
        head.mutate();
        head.mutatedType.members.delete(oldTail.sourceType.name);
        head.mutatedType.members.set(newTail.mutatedType.name, newTail.mutatedType);
        if (reconnect) {
          head.connectMember(newTail as MutationNode<EnumMember>);
        }
      },
    });
  }

  /** Connects a member and its enum back-reference via {@link startMemberEdge}. */
  connectMember(memberNode: MutationNode<EnumMember>) {
    this.startMemberEdge().setTail(memberNode);
  }
}
