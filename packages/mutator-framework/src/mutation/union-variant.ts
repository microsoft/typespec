import type { MemberType, Type, UnionVariant } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class UnionVariantMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<UnionVariant, TCustomMutations, TOptions, TEngine> {
  readonly kind = "UnionVariant";
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  constructor(
    engine: TEngine,
    sourceType: UnionVariant,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  mutate(): void {
    this.type = this.engine.mutate(this.sourceType.type, this.options);
  }
}
