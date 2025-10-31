import type { MemberType, UnionVariant } from "@typespec/compiler";
import { UnionVariantMutation } from "@typespec/mutator-framework";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizer } from "./http-canonicalization.js";
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

  /**
   * Mutation subgraph for language types.
   */
  get #languageSubgraph() {
    return this.engine.getLanguageSubgraph(this.options);
  }

  /**
   * Mutation subgraph for wire types.
   */
  get #wireSubgraph() {
    return this.engine.getWireSubgraph(this.options);
  }

  /**
   * The possibly mutated language type for this variant.
   */
  get languageType() {
    return this.getMutatedType(this.#languageSubgraph);
  }

  /**
   * The possibly mutated wire type for this variant.
   */
  get wireType() {
    return this.getMutatedType(this.#wireSubgraph);
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
    this.options = options;
    this.isDeclaration = !!this.sourceType.name;
  }

  /**
   * Canonicalize this union variant for HTTP.
   */
  mutate() {
    const languageNode = this.getMutationNode(this.#languageSubgraph);
    const wireNode = this.getMutationNode(this.#wireSubgraph);

    if (this.isVisible) {
      super.mutate();
      return;
    }

    languageNode.delete();
    wireNode.delete();
  }
}
