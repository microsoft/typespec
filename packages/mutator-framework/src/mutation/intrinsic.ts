import type { IntrinsicType, MemberType } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/** Leaf strategy for compiler intrinsic types such as `null`, `void`, and `never`. */
export class IntrinsicMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<IntrinsicType, TCustomMutations, TOptions, TEngine> {
  /** Identifies intrinsic strategies independently of the particular intrinsic's name. */
  readonly kind = "Intrinsic";
  /** Initializes an intrinsic strategy without constructing a mutation node. */
  constructor(
    engine: TEngine,
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /** Performs no traversal or transformation by default; intrinsics have no child strategies. */
  mutate() {
    // No mutations needed for intrinsic types
  }
}
