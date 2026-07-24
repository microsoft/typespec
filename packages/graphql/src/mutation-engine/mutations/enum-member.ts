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
 * GraphQL-specific EnumMember mutation.
 */
export class GraphQLEnumMemberMutation extends EnumMemberMutation<
  MutationOptions,
  any,
  MutationEngine<any>
> {
  #mutationNode: EnumMemberMutationNode;

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

  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }

  mutate() {
    this.#mutationNode.mutate((member) => {
      member.name = applyEnumMemberPipeline(member.name);
    });
    super.mutate();
  }
}
