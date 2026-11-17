import type { EnumMember, MemberType } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/** Leaf strategy for enum members; does not traverse back to the containing enum. */
export class EnumMemberMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<EnumMember, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "EnumMember";

  /** Initializes a member strategy without constructing a mutation node. */
  constructor(
    engine: TEngine,
    sourceType: EnumMember,
    referenceTypes: MemberType[] = [],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /** Performs no traversal; override to implement member transformations. */
  mutate() {
    // EnumMember is a leaf type with no children to mutate
  }
}
