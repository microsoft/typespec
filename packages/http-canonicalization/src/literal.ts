import type { BooleanLiteral, MemberType, NumericLiteral, StringLiteral } from "@typespec/compiler";
import {
  LiteralMutation,
  type MutationHalfEdge,
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
 * Canonicalizes literal types for HTTP.
 */
export class LiteralHttpCanonicalization
  extends LiteralMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration = false;
  codec: Codec | null = null;

  #languageMutationNode: MutationNodeForType<StringLiteral | NumericLiteral | BooleanLiteral>;
  #wireMutationNode: MutationNodeForType<StringLiteral | NumericLiteral | BooleanLiteral>;

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
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Literals don't need a codec
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.options = options;
    this.#languageMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-language",
    );
    this.#wireMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-wire",
    );
  }
}
