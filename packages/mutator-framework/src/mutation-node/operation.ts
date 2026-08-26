import type { Interface, Model, Operation, Type } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

export interface OperationConnectOptions {
  /** Mutation key for the parameters node. Defaults to this node's key. */
  parameters?: string;
  /** Mutation key for the return type node. Defaults to this node's key. */
  returnType?: string;
}

export class OperationMutationNode extends MutationNode<Operation> {
  readonly kind = "Operation";

  startParametersEdge() {
    return new HalfEdge<Operation, Model>(this, {
      onTailMutation: ({ tail }) => {
        this.mutatedType!.parameters = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.parameters = this.$.model.create({
          name: "",
          properties: {},
        });
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        if (newTail.mutatedType.kind !== "Model") {
          throw new Error("Cannot replace parameters with non-model type");
        }
        head.mutatedType.parameters = newTail.mutatedType;
        if (reconnect) {
          head.connectParameters(newTail as MutationNode<Model>);
        }
      },
    });
  }

  connectParameters(baseNode: MutationNode<Model>) {
    this.startParametersEdge().setTail(baseNode);
  }

  startReturnTypeEdge() {
    return new HalfEdge<Operation, Type>(this, {
      onTailMutation: ({ tail }) => {
        this.mutatedType!.returnType = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.mutatedType.returnType = this.$.intrinsic.void;
      },
      onTailReplaced: ({ newTail, head, reconnect }) => {
        head.mutatedType.returnType = newTail.mutatedType;
        if (reconnect) {
          head.connectReturnType(newTail);
        }
      },
    });
  }

  connectReturnType(typeNode: MutationNode<Type>) {
    this.startReturnTypeEdge().setTail(typeNode);
  }

  startInterfaceEdge() {
    return new HalfEdge<Operation, Interface>(this, {
      onTailMutation: ({ tail }) => {
        this.mutate();
        this.mutatedType.interface = tail.mutatedType;
      },
      onTailDeletion: () => {
        this.delete();
      },
      onTailReplaced: ({ head }) => {
        head.delete();
      },
    });
  }

  connectInterface(interfaceNode: MutationNode<Interface>) {
    this.startInterfaceEdge().setTail(interfaceNode);
  }
}
