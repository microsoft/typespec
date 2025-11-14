import type { MemberType, Union } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export abstract class UnionMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Union, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Union";
  variants: Map<string | symbol, MutationFor<TCustomMutations, "UnionVariant">> = new Map();

  constructor(
    engine: TEngine,
    sourceType: Union,
    referenceTypes: MemberType[] = [],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateVariants() {
    for (const variant of this.sourceType.variants.values()) {
      this.variants.set(
        variant.name,
        this.engine.mutate(variant, this.options, this.startVariantEdge()),
      );
    }
  }

  protected abstract startVariantEdge(): MutationHalfEdge;

  mutate() {
    this.mutateVariants();
  }
}
