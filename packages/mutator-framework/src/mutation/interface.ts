import type { Interface, MemberType } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class InterfaceMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
> extends Mutation<Interface, TCustomMutations, TOptions> {
  readonly kind = "Interface";
  operations: Map<string, MutationFor<TCustomMutations, "Operation">> = new Map();

  constructor(
    engine: MutationEngine<TCustomMutations>,
    sourceType: Interface,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  protected mutateOperations() {
    for (const op of this.sourceType.operations.values()) {
      this.operations.set(
        op.name,
        this.engine.mutate(op, this.options) as MutationFor<TCustomMutations, "Operation">,
      );
    }
  }

  mutate() {
    this.mutateOperations();
  }
}
