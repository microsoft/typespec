import type { MemberType, UnionVariant } from "@typespec/compiler";
import {
  MutationHalfEdge,
  UnionVariantMutation,
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
 * Canonicalizes a union variant for HTTP.
 */
export class UnionVariantHttpCanonicalization
  extends UnionVariantMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration: boolean = false;
  codec: Codec | null = null;
  /**
   * Whether the variant is visible under the current visibility options.
   */
  isVisible: boolean = true;

  #languageMutationNode: MutationNodeForType<UnionVariant>;
  #wireMutationNode: MutationNodeForType<UnionVariant>;

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
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Union variants don't need a codec
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: UnionVariant,
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
    this.isDeclaration = !!this.sourceType.name;
  }

  protected startTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge("type", this, (tail) => {
      this.#languageMutationNode.connectType(tail.languageMutationNode);
      this.#wireMutationNode.connectType(tail.wireMutationNode);
    });
  }

  /**
   * Canonicalize this union variant for HTTP.
   */
  mutate() {
    if (this.isVisible) {
      super.mutate();
      return;
    }

    this.#languageMutationNode.delete();
    this.#wireMutationNode.delete();
  }
}
