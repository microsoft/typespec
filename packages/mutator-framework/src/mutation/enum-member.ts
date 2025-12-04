import type { EnumMember, MemberType } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export class EnumMemberMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<EnumMember, TCustomMutations, TOptions, TEngine> {
  readonly kind = "EnumMember";

  constructor(
    engine: TEngine,
    sourceType: EnumMember,
    referenceTypes: MemberType[] = [],
    options: TOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
  }

  mutate() {
    // EnumMember is a leaf type with no children to mutate
  }
}
