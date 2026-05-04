import type { IntrinsicType, MemberType } from "@typespec/compiler";
import {
  IntrinsicMutation,
  type MutationHalfEdge,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import type { Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import {
  HttpCanonicalizer,
  type CanonicalizationPredicate,
  type HttpCanonicalizationCommon,
  type HttpCanonicalizationInfo,
} from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes intrinsic types for HTTP.
 */
export class IntrinsicHttpCanonicalization
  extends IntrinsicMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration = false;
  codec: Codec | null = null;

  #languageMutationNode: MutationNodeForType<IntrinsicType>;
  #wireMutationNode: MutationNodeForType<IntrinsicType>;

  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  get wireMutationNode() {
    return this.#wireMutationNode;
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
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Intrinsics don't need a codec
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#languageMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-language",
    );
    this.#wireMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-wire",
    );
  }

  /**
   * The possibly mutated language type for this intrinsic.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this intrinsic.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }
}
