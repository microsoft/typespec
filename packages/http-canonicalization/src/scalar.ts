import type { MemberType, Scalar } from "@typespec/compiler";
import {
  MutationHalfEdge,
  ScalarMutation,
  type MutationNodeForType,
} from "@typespec/mutator-framework";
import { getJsonEncoderRegistry, type Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes scalar types by applying encoding-specific mutations.
 */
export class ScalarHttpCanonicalization extends ScalarMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Canonicalization options.
   */
  options: HttpCanonicalizationOptions;
  /**
   * Codec responsible for transforming the scalar into language and wire types.
   */
  codec: Codec;
  /**
   * Indicates whether the scalar is a named TypeSpec declaration.
   */
  isDeclaration: boolean = false;

  #languageMutationNode: MutationNodeForType<Scalar>;
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  #wireMutationNode: MutationNodeForType<Scalar>;
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The possibly mutated language type for this scalar.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this scalar.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    let mutationKey = options.mutationKey;
    const codec = getJsonEncoderRegistry(engine.$).detect(sourceType, referenceTypes);

    if (codec) {
      mutationKey += `-codec-${codec.id}`;
    }

    return {
      mutationKey,
      codec,
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

    this.codec = info.codec;
    this.isDeclaration = false;
  }

  /**
   * Canonicalize this scalar for HTTP.
   */
  mutate() {
    const { languageType, wireType } = this.codec.encode();
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
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectBaseScalar(tail.languageMutationNode);
      this.#wireMutationNode.connectBaseScalar(tail.wireMutationNode);
    });
  }
}
