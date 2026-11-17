import type { MemberType, Type, UnionVariant } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Resolves a variant's underlying type through any member reference chain.
 * Subclasses supply its output connection; the containing union is not traversed.
 */
export abstract class UnionVariantMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<UnionVariant, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "UnionVariant";
  /** Underlying type strategy, assigned during traversal rather than construction. */
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  /** Initializes reference traversal with the source variant and selected mutation metadata. */
  constructor(
    engine: TEngine,
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /** Resolves the source reference chain and attaches its result through a type half-edge. */
  mutate(): void {
    this.type = this.engine.mutateReference(this.sourceType, this.options, this.startTypeEdge());
  }

  protected abstract startTypeEdge(): MutationHalfEdge;
}
