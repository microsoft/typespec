import type { MemberType, Scalar } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class ScalarMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Scalar, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Scalar";
  baseScalar?: MutationFor<TCustomMutations, "Scalar">;

  constructor(
    engine: TEngine,
    sourceType: Scalar,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  protected mutateBaseScalar() {
    if (this.sourceType.baseScalar) {
      this.baseScalar = this.engine.mutate(this.sourceType.baseScalar, this.options);
    }
  }

  mutate() {
    this.mutateBaseScalar();
  }
}
