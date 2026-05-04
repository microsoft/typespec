import type { Enum, MemberType } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

export class EnumMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Enum, TCustomMutations, TOptions, TEngine> {
  readonly kind = "Enum";
  members: Map<string, MutationFor<TCustomMutations, "EnumMember">> = new Map();

  constructor(
    engine: TEngine,
    sourceType: Enum,
    referenceTypes: MemberType[] = [],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateMembers() {
    for (const member of this.sourceType.members.values()) {
      this.members.set(member.name, this.engine.mutate(member, this.options));
    }
  }

  mutate() {
    this.mutateMembers();
  }
}
