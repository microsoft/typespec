import type { ModelProperty, Type } from "@typespec/compiler";
import type { MutationSubgraph } from "../mutation-node/mutation-subgraph.js";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class ModelPropertyMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<ModelProperty, TCustomMutations, TOptions, TEngine> {
  readonly kind = "ModelProperty";
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  mutate() {
    this.type = this.engine.mutateReference(this.sourceType, this.options);
  }

  getReferenceMutationNode(
    subgraph: MutationSubgraph = this.engine.getDefaultMutationSubgraph(this.options),
  ) {
    return subgraph.getReferenceNode(this.sourceType);
  }

  replaceReferencedType(subgraph: MutationSubgraph, newType: Type) {
    // First, update the mutation node
    subgraph.getReferenceNode(this.sourceType).replace(newType);
    // then return a new reference mutation for the new type
    return this.engine.mutateReference(this.sourceType, newType, this.options);
  }
}
