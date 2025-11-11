import type { IntrinsicType, MemberType } from "@typespec/compiler";
import { IntrinsicMutation, type MutationNodeForType } from "@typespec/mutator-framework";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import { HttpCanonicalizer, type HttpCanonicalizationInfo } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes intrinsic types for HTTP.
 */
export class IntrinsicHttpCanonicalization extends IntrinsicMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Indicates if this intrinsic represents a named declaration. Always false.
   */
  isDeclaration: boolean = false;
  #languageMutationNode: MutationNodeForType<IntrinsicType>;
  #wireMutationNode: MutationNodeForType<IntrinsicType>;

  /**
   * The language mutation node for this intrinsic.
   */
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  /**
   * The wire mutation node for this intrinsic.
   */
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Intrinsics don't need a codec
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
