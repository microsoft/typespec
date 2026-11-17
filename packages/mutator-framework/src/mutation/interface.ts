import type { Interface, MemberType } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Traverses the operations in a source interface's operation map.
 * Subclasses supply the half-edge that connects each operation to the output graph.
 */
export abstract class InterfaceMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
> extends Mutation<Interface, TCustomMutations, TOptions> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Interface";
  /** Operation strategies in source map order, keyed by their original names. */
  operations: Map<string, MutationFor<TCustomMutations, "Operation">> = new Map();

  /** Initializes operation traversal with the source interface and selected options. */
  constructor(
    engine: MutationEngine<TCustomMutations>,
    sourceType: Interface,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateOperations() {
    for (const op of this.sourceType.operations.values()) {
      this.operations.set(
        op.name,
        this.engine.mutate(op, this.options, this.startOperationEdge()) as MutationFor<
          TCustomMutations,
          "Operation"
        >,
      );
    }
  }

  protected abstract startOperationEdge(): MutationHalfEdge;

  /** Resolves source operations with this strategy's options and connects each result. */
  mutate() {
    this.mutateOperations();
  }
}
