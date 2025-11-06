import type { BooleanLiteral, MemberType, NumericLiteral, StringLiteral } from "@typespec/compiler";
import { LiteralMutation } from "@typespec/mutator-framework";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizer } from "./http-canonicalization.js";
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
   * The possibly mutated language type for this literal.
   */
  get languageType() {
    return this.getMutatedType(this.#languageSubgraph);
  }

  /**
   * The possibly mutated wire type for this literal.
   */
  get wireType() {
    return this.getMutatedType(this.#wireSubgraph);
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
    this.options = options;
  }
}
