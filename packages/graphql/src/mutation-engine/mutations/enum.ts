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
 * Normalizes a GraphQL enum's type name and value names while keeping graph
 * connections synchronized with renamed members.
 */
export class GraphQLEnumMutation extends EnumMutation<MutationOptions, any, MutationEngine<any>> {
  #mutationNode: EnumMutationNode;

  /**
   * Binds the enum transformation to the engine's node for the supplied cache
   * identity. Prefer `GraphQLMutationEngine.mutateEnum` to create or reuse
   * the mutation and process its members.
   */
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

  /** Graph node tracking the enum result and its connections to member mutations. */
  get mutationNode() {
    return this.#mutationNode;
  }

  /** Enum held by the mutation node, with transformed names after mutation completes. */
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

  /**
   * Normalizes the enum type name and mutates its members with bidirectional
   * edges so renamed values remain addressable in the resulting enum.
   * Invoked by the mutation engine.
   */
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
