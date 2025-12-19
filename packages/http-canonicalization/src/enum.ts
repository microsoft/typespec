import type { Enum, MemberType } from "@typespec/compiler";
import {
  EnumMutation,
  MutationHalfEdge,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import type { Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type {
  CanonicalizationPredicate,
  HttpCanonicalizationCommon,
  HttpCanonicalizationInfo,
  HttpCanonicalizer,
} from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes enum types for HTTP.
 */
export class EnumHttpCanonicalization
  extends EnumMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration: boolean = false;
  codec: Codec | null = null;

  #languageMutationNode: MutationNodeForType<Enum>;
  #wireMutationNode: MutationNodeForType<Enum>;

  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  /**
   * Tests whether the subgraph rooted at this canonicalization uses only
   * the identity codec (no transformation).
   */
  subgraphUsesIdentityCodec(): boolean {
    return this.engine.subgraphUsesIdentityCodec(this);
  }

  /**
   * Tests whether the subgraph rooted at this canonicalization satisfies
   * the provided predicate.
   */
  subgraphMatchesPredicate(predicate: CanonicalizationPredicate): boolean {
    return this.engine.subgraphMatchesPredicate(this, predicate);
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Enum,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Enums don't need a codec
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Enum,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.options = options;
    this.#languageMutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey + "-language",
      isSynthetic: info.isSynthetic,
    });
    this.#wireMutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey + "-wire",
      isSynthetic: info.isSynthetic,
    });
    this.isDeclaration = !!this.sourceType.name;
  }

  protected startMemberEdge(): MutationHalfEdge {
    return new MutationHalfEdge("member", this, (tail) => {
      this.#languageMutationNode.connectMember(tail.languageMutationNode);
      this.#wireMutationNode.connectMember(tail.wireMutationNode);
    });
  }

  /**
   * Canonicalize this enum for HTTP.
   */
  mutate() {
    super.mutateMembers();
  }
}
