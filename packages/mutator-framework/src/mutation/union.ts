import type { MemberType, Union } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Traverses a snapshot of a source union's variants in their map order.
 * Subclasses provide half-edges connecting variant strategies to the output graph.
 */
export abstract class UnionMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Union, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Union";
  /** Variant strategies keyed by original names, including symbols for unnamed variants. */
  variants: Map<string | symbol, MutationFor<TCustomMutations, "UnionVariant">> = new Map();

  /** Initializes variant traversal with the source union and selected mutation metadata. */
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
    const variants = [...this.sourceType.variants.values()];
    for (const variant of variants) {
      this.variants.set(
        variant.name,
        this.engine.mutate(variant, this.options, this.startVariantEdge()),
      );
    }
  }

  protected abstract startVariantEdge(): MutationHalfEdge;

  /** Resolves and connects each source variant using this strategy's options. */
  mutate() {
    this.mutateVariants();
  }
}
