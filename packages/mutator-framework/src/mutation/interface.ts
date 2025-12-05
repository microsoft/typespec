import type { Interface, MemberType } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export abstract class InterfaceMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
> extends Mutation<Interface, TCustomMutations, TOptions> {
  readonly kind = "Interface";
  operations: Map<string, MutationFor<TCustomMutations, "Operation">> = new Map();

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

  mutate() {
    this.mutateOperations();
  }
}
