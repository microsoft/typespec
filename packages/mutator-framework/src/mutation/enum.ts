import type { Enum, MemberType } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Collects mutations of an enum's source members without creating node edges.
 * Consumers needing output propagation must establish those connections separately.
 */
export class EnumMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Enum, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Enum";
  /** Member strategies in source order, keyed by their original names. */
  members: Map<string, MutationFor<TCustomMutations, "EnumMember">> = new Map();

  /** Initializes member traversal with the source enum and selected mutation metadata. */
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

  /** Resolves source member strategies with this strategy's options; does not connect nodes. */
  mutate() {
    this.mutateMembers();
  }
}
