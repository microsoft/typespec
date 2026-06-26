import type { IntrinsicType, MemberType } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export class IntrinsicMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<IntrinsicType, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Intrinsic";
  constructor(
    engine: TEngine,
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  mutate() {
    // No mutations needed for intrinsic types
  }
}
