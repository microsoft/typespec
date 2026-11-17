import type { Interface, Model, Operation, Type } from "@typespec/compiler";
import { HalfEdge } from "./mutation-edge.js";
import { MutationNode } from "./mutation-node.js";

/** Connection-key configuration shape; current node connection methods do not consume it. */
export interface OperationConnectOptions {
  /** Key designated for parameters; callers must select that model node explicitly. */
  parameters?: string;
  /** Key designated for the result; callers must select that type node explicitly. */
  returnType?: string;
}

/**
 * Maintains an operation's parameter, return-type, and containing-interface references.
 * Parameter and result callbacks write the current output directly; call `mutate()`
 * first when those writes must target a clone rather than the source.
 */
export class OperationMutationNode extends MutationNode<Operation> {
  /** Selects operation-specific connection behavior. */
  readonly kind = "Operation";

  /**
   * Starts a parameter reference. Deletion substitutes an empty anonymous model;
   * replacement requires a model. Updates do not themselves clone this operation.
   */
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

  /** Completes {@link startParametersEdge} with the chosen parameter model node. */
  connectParameters(baseNode: MutationNode<Model>) {
    this.startParametersEdge().setTail(baseNode);
  }

  /**
   * Starts a result reference that accepts replacements of any type kind.
   * Deletion substitutes `void`. Updates write the current output without cloning it.
   */
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

  /** Completes {@link startReturnTypeEdge} with the chosen result type node. */
  connectReturnType(typeNode: MutationNode<Type>) {
    this.startReturnTypeEdge().setTail(typeNode);
  }

  /**
   * Starts the containing-interface back-reference.
   * Interface mutation clones this operation as needed and updates its owner;
   * interface deletion or replacement deletes this operation.
   */
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

  /** Completes {@link startInterfaceEdge}; normally established by an interface's operation connection. */
  connectInterface(interfaceNode: MutationNode<Interface>) {
    this.startInterfaceEdge().setTail(interfaceNode);
  }
}
