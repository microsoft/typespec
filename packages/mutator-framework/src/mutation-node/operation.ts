import type { Model, Operation, Type } from "@typespec/compiler";
import { MutationEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export class OperationMutationNode extends MutationNode<Operation> {
  readonly kind = "Operation";

  traverse() {
    const parameterNode = this.subgraph.getNode(this.sourceType.parameters);
    this.connectParameters(parameterNode);

    const returnTypeNode = this.subgraph.getNode(this.sourceType.returnType);
    this.connectReturnType(returnTypeNode);
  }

  connectParameters(baseNode: MutationNode<Model>) {
    MutationEdge.create(this, baseNode, {
      onTailMutation: () => {
        this.mutatedType!.parameters = baseNode.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.parameters = this.$.model.create({
          name: "",
          properties: {},
        });
      },
      onTailReplaced: (newTail) => {
        if (newTail.mutatedType.kind !== "Model") {
          throw new Error("Cannot replace parameters with non-model type");
        }
        this.mutatedType.parameters = newTail.mutatedType;
      },
    });
  }

  connectReturnType(typeNode: MutationNode<Type>) {
    MutationEdge.create(this, typeNode, {
      onTailMutation: () => {
        this.mutatedType!.returnType = typeNode.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.returnType = this.$.intrinsic.void;
      },
      onTailReplaced: (newTail) => {
        this.mutatedType.returnType = newTail.mutatedType;
      },
    });
  }
}
