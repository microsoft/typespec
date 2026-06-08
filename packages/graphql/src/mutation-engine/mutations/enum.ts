import type { Enum, MemberType } from "@typespec/compiler";
import {
  EnumMemberMutationNode,
  EnumMutation,
  EnumMutationNode,
  MutationEngine,
  MutationHalfEdge,
  type MutationInfo,
  type MutationOptions,
} from "@typespec/mutator-framework";
import { applyTypeNamePipeline } from "../../lib/naming.js";
import type { GraphQLEnumMemberMutation } from "./enum-member.js";

/**
 * GraphQL-specific Enum mutation.
 */
export class GraphQLEnumMutation extends EnumMutation<MutationOptions, any, MutationEngine<any>> {
  #mutationNode: EnumMutationNode;

  constructor(
    engine: MutationEngine<any>,
    sourceType: Enum,
    referenceTypes: MemberType[],
    options: MutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    }) as EnumMutationNode;
  }

  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }

  /**
   * Creates a MutationHalfEdge that wraps the node-level edge.
   * This ensures proper bidirectional updates when members are renamed.
   */
  protected startMemberEdge(): MutationHalfEdge<GraphQLEnumMutation, GraphQLEnumMemberMutation> {
    return new MutationHalfEdge("member", this, (tail) => {
      this.#mutationNode.connectMember(tail.mutationNode as EnumMemberMutationNode);
    });
  }

  /**
   * Override to pass half-edge for proper bidirectional updates.
   */
  protected override mutateMembers() {
    for (const member of this.sourceType.members.values()) {
      this.members.set(
        member.name,
        this.engine.mutate(member, this.options, this.startMemberEdge()),
      );
    }
  }

  mutate() {
    this.#mutationNode.mutate((enumType) => {
      enumType.name = applyTypeNamePipeline(enumType.name, {
        isInput: false,
        isInterface: false,
      });
    });
    // Handle member mutations with proper edges
    this.mutateMembers();
    // Call super to finalize
    super.mutate();
  }
}
