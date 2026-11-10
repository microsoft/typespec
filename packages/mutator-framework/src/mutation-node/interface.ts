import type { Interface, Operation } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface InterfaceConnectOptions {
  /** Keys designated by source operation name; callers must select those nodes explicitly. */
  operations?: Record<string, string>;
}

/**
 * Maintains an interface's operation map through explicit connections.
 * Operation callbacks write the current output map directly; call `mutate()`
 * first when the map must belong to a clone rather than the source interface.
 */
export class InterfaceMutationNode extends MutationNode<Interface> {
  /** Selects interface-specific operation connections. */
  readonly kind = "Interface";

  /**
   * Starts an operation reference and establishes its interface back-reference.
   * Renames replace source-name entries, deletion removes them, and replacement
   * requires an operation. Map updates do not themselves clone this interface.
   */
  startOperationEdge() {
    return new HalfEdge<Interface, Operation>(this, {
      onTailCreation: ({ tail }) => {
        tail.connectInterface(this);
      },
      onTailMutation: ({ tail }) => {
        this.mutatedType.operations.delete(tail.sourceType.name);
        this.mutatedType.operations.set(tail.mutatedType.name, tail.mutatedType);
      },
      onTailDeletion: ({ tail }) => {
        this.mutatedType.operations.delete(tail.sourceType.name);
      },
      onTailReplaced: ({ oldTail, newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "Operation") {
          throw new Error("Cannot replace operation with non-operation type");
        }
        head.mutatedType.operations.delete(oldTail.sourceType.name);
        head.mutatedType.operations.set(newTail.mutatedType.name, newTail.mutatedType);
        if (reconnect) {
          head.connectOperation(newTail as MutationNode<Operation>);
        }
      },
    });
  }

  /** Connects an operation and its interface back-reference via {@link startOperationEdge}. */
  connectOperation(opNode: MutationNode<Operation>) {
    this.startOperationEdge().setTail(opNode);
  }
}
