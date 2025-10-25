import type { Interface, Operation } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class InterfaceMutationNode extends MutationNode<Interface> {
  readonly kind = "Interface";

  traverse() {
    for (const [opName, op] of this.sourceType.operations) {
      const opNode = this.subgraph.getNode(op);
      this.connectOperation(opNode, opName);
    }
  }

  connectOperation(opNode: MutationNode<Operation>, opName: string) {
    MutationEdge.create(this, opNode, {
      onTailMutation: () => {
        this.mutatedType.operations.delete(opName);
        this.mutatedType.operations.set(opNode.mutatedType.name, opNode.mutatedType);
      },
      onTailDeletion: () => {
        this.mutatedType.operations.delete(opName);
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "Operation") {
          throw new Error("Cannot replace operation with non-operation type");
        }
        this.mutatedType.operations.delete(opName);
        this.mutatedType.operations.set(newTail.mutatedType.name, newTail.mutatedType);
      },
    });
  }
}
