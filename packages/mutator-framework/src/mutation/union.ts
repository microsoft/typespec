import type { MemberType, Union } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class UnionMutation<
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
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  protected mutateVariants() {
    this.variants = new Map(
      [...this.sourceType.variants].map(([name, variant]) => [
        name,
        this.engine.mutate(variant, this.options),
      ]),
    );
  }

  mutate() {
    this.mutateVariants();
  }
}
