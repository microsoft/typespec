import type { BooleanLiteral, MemberType, NumericLiteral, StringLiteral } from "@typespec/compiler";
import { LiteralMutation, type MutationNodeForType } from "@typespec/mutator-framework";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes literal types for HTTP.
 */
export class LiteralHttpCanonicalization extends LiteralMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Canonicalization options.
   */
  options: HttpCanonicalizationOptions;
  /**
   * Indicates if the literal is defined as a named TypeSpec declaration. Always
   * false for literals.
   */
  isDeclaration: boolean = false;

  #languageMutationNode: MutationNodeForType<StringLiteral | NumericLiteral | BooleanLiteral>;
  #wireMutationNode: MutationNodeForType<StringLiteral | NumericLiteral | BooleanLiteral>;

  /**
   * The language mutation node for this literal.
   */
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  /**
   * The wire mutation node for this literal.
   */
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The possibly mutated language type for this literal.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this literal.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Literals don't need a codec
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
