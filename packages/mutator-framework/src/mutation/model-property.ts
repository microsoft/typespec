import type { ModelProperty, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

/**
 * Resolves a property's underlying type through any member reference chain.
 * Subclasses provide the output connection; this strategy does not traverse the
 * property's containing model.
 */
export abstract class ModelPropertyMutation<
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<ModelProperty, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "ModelProperty";
  /** Underlying type strategy, assigned during traversal rather than construction. */
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  /** Resolves the source reference chain and attaches its result through a type half-edge. */
  mutate(newOptions: MutationOptions = this.options) {
    this.type = this.engine.mutateReference(
      this.sourceType,
      newOptions,
      this.startTypeEdge(),
    ) as MutationFor<TCustomMutations, Type["kind"]>;
  }

  protected abstract startTypeEdge(): MutationHalfEdge;
}
