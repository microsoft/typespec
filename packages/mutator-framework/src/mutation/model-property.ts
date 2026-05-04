import type { ModelProperty, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export abstract class ModelPropertyMutation<
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<ModelProperty, TCustomMutations, TOptions, TEngine> {
  readonly kind = "ModelProperty";
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  mutate(newOptions: MutationOptions = this.options) {
    this.type = this.engine.mutateReference(
      this.sourceType,
      newOptions,
      this.startTypeEdge(),
    ) as MutationFor<TCustomMutations, Type["kind"]>;
  }

  protected abstract startTypeEdge(): MutationHalfEdge;
}
