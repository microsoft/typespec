import type { MemberType, Scalar } from "@typespec/compiler";
import {
  MutationHalfEdge,
  ScalarMutation,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import { type Codec, type EncodingInfo } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type {
  CanonicalizationPredicate,
  HttpCanonicalizationCommon,
  HttpCanonicalizationInfo,
  HttpCanonicalizer,
} from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes scalar types by applying encoding-specific mutations.
 */
export class ScalarHttpCanonicalization
  extends ScalarMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  codec: Codec;
  #encodingInfo: EncodingInfo;
  isDeclaration: boolean = false;

  #languageMutationNode: MutationNodeForType<Scalar>;
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  #wireMutationNode: MutationNodeForType<Scalar>;
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
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    let mutationKey = options.mutationKey;
    const encodingInfo = engine.codecs.encode(sourceType, referenceTypes);

    if (encodingInfo.codec) {
      mutationKey += `-codec-${encodingInfo.codec.id}`;
    }

    return {
      mutationKey,
      encodingInfo,
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Scalar,
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

    this.#encodingInfo = info.encodingInfo!;
    this.codec = info.encodingInfo!.codec;
    this.isDeclaration = false;
  }

  /**
   * Canonicalize this scalar for HTTP.
   */
  mutate() {
    const { languageType, wireType } = this.#encodingInfo;
    if (languageType !== this.sourceType) {
      this.#languageMutationNode = this.#languageMutationNode.replace(
        languageType as Scalar,
      ) as MutationNodeForType<Scalar>;
    }
    if (wireType !== this.sourceType) {
      this.#wireMutationNode = this.#wireMutationNode.replace(
        wireType as Scalar,
      ) as MutationNodeForType<Scalar>;
    }
  }

  protected startBaseScalarEdge(): MutationHalfEdge {
    return new MutationHalfEdge("base", this, (tail) => {
      this.#languageMutationNode.connectBaseScalar(tail.languageMutationNode);
      this.#wireMutationNode.connectBaseScalar(tail.wireMutationNode);
    });
  }
}
