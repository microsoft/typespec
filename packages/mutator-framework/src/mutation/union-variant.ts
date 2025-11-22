import type { MemberType, Type, UnionVariant } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export abstract class UnionVariantMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<UnionVariant, TCustomMutations, TOptions, TEngine> {
  readonly kind = "UnionVariant";
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  constructor(
    engine: TEngine,
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  mutate(): void {
    this.type = this.engine.mutate(this.sourceType.type, this.options, this.startTypeEdge());
  }

  protected abstract startTypeEdge(): MutationHalfEdge;
}
