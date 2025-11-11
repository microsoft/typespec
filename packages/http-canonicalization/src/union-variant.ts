import type { MemberType, UnionVariant } from "@typespec/compiler";
import {
  MutationHalfEdge,
  UnionVariantMutation,
  type MutationNodeForType,
} from "@typespec/mutator-framework";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes a union variant for HTTP.
 */
export class UnionVariantHttpCanonicalization extends UnionVariantMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Canonicalization options.
   */
  options: HttpCanonicalizationOptions;
  /**
   * Indicates if the variant corresponds to a named declaration. Always false.
   */
  isDeclaration: boolean = false;
  /**
   * Whether the variant is visible under the current visibility options.
   */
  isVisible: boolean = true;

  #languageMutationNode: MutationNodeForType<UnionVariant>;
  #wireMutationNode: MutationNodeForType<UnionVariant>;

  /**
   * The language mutation node for this variant.
   */
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  /**
   * The wire mutation node for this variant.
   */
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The possibly mutated language type for this variant.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this variant.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Union variants don't need a codec
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
    return new MutationHalfEdge(this, (tail) => {
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
