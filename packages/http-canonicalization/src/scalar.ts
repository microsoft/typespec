import type { MemberType, Scalar } from "@typespec/compiler";
import { ScalarMutation } from "@typespec/mutator-framework";
import { getJsonEncoderRegistry, type Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizer } from "./http-canonicalization.js";
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
   * The possibly mutated language type for this scalar.
   */
  get languageType() {
    return this.getMutatedType(this.#languageSubgraph);
  }

  /**
   * The possibly mutated wire type for this scalar.
   */
  get wireType() {
    return this.getMutatedType(this.#wireSubgraph);
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
    this.options = options;

    const registry = getJsonEncoderRegistry(this.engine.$);
    this.codec = registry.detect(this);
    this.isDeclaration = false;
  }

  /**
   * Canonicalize this scalar for HTTP.
   */
  mutate() {
    const languageNode = this.getMutationNode(this.#languageSubgraph);
    const wireNode = this.getMutationNode(this.#wireSubgraph);

    const { languageType, wireType } = this.codec.encode();
    if (languageType !== this.sourceType) {
      languageNode.replace(languageType as Scalar);
    }
    if (wireType !== this.sourceType) {
      wireNode.replace(wireType as Scalar);
    }
  }
}
