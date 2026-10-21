import type { EnumMember, MemberType } from "@typespec/compiler";
import {
  EnumMemberMutation,
  EnumMemberMutationNode,
  MutationEngine,
  type MutationInfo,
  type MutationOptions,
} from "@typespec/mutator-framework";
import { applyEnumMemberPipeline } from "../../lib/naming.js";

/**
 * Normalizes a GraphQL enum value name while preserving its connection to
 * the containing enum.
 */
export class GraphQLEnumMemberMutation extends EnumMemberMutation<
  MutationOptions,
  any,
  MutationEngine<any>
> {
  #mutationNode: EnumMemberMutationNode;

  /**
   * Associates a value transformation with the engine's member node and cache
   * identity. Normally created by the engine while mutating an enum, rather
   * than constructed independently.
   */
  constructor(
    engine: MutationEngine<any>,
    sourceType: EnumMember,
    referenceTypes: MemberType[],
    options: MutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    }) as EnumMemberMutationNode;
  }

  /** Graph node used to synchronize this value with its containing enum. */
  get mutationNode() {
    return this.#mutationNode;
  }

  /** Enum member held by the node, with its GraphQL value name after mutation completes. */
  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }

  /** Applies GraphQL enum-value naming and finalizes the member through the mutation framework. */
  mutate() {
    this.#mutationNode.mutate((member) => {
      member.name = applyEnumMemberPipeline(member.name);
    });
    super.mutate();
  }
}
