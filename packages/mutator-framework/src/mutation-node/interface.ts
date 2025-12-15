import type { Interface, Operation } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface InterfaceConnectOptions {
  /** Mutation keys for operation nodes, keyed by operation name. Defaults to this node's key for all. */
  operations?: Record<string, string>;
}

export class InterfaceMutationNode extends MutationNode<Interface> {
  readonly kind = "Interface";

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

  connectOperation(opNode: MutationNode<Operation>) {
    this.startOperationEdge().setTail(opNode);
  }
}
