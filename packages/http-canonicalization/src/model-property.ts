import type { MemberType, ModelProperty } from "@typespec/compiler";
import {
  getHeaderFieldOptions,
  getPathParamOptions,
  getQueryParamOptions,
  isBody,
  isBodyRoot,
  isMetadata,
  isVisible,
} from "@typespec/http";
import {
  ModelPropertyMutation,
  MutationHalfEdge,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import type { Codec, EncodingInfo } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type {
  CanonicalizationPredicate,
  HttpCanonicalizationCommon,
  HttpCanonicalizationInfo,
  HttpCanonicalizer,
} from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes model properties, tracking request/response metadata and visibility.
 */
export class ModelPropertyHttpCanonicalization
  extends ModelPropertyMutation<
    HttpCanonicalizationMutations,
    HttpCanonicalizationOptions,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration = false;

  /**
   * Whether the property is visible given the current visibility options.
   */
  isVisible: boolean = false;

  codec: Codec | null = null;

  #encodingInfo: EncodingInfo | null = null;

  /**
   * True when the property is a query parameter.
   */
  isQueryParameter: boolean = false;

  /**
   * The query parameter name when the property is a query parameter, else the
   * empty string.
   */
  queryParameterName: string = "";

  /**
   * True when the property is an HTTP header.
   */
  isHeader: boolean = false;
  /**
   * The header name when the property is an HTTP header, else the empty string.
   */
  headerName: string = "";

  /**
   * Whether the property is metadata (i.e. not part of an HTTP body).
   */
  isMetadata: boolean = false;

  /**
   * True when the property is a path parameter.
   */
  isPathParameter: boolean = false;
  /**
   * The path parameter name when the property is a path parameter, else the
   * empty string.
   */
  pathParameterName: string = "";

  /**
   * Whether structured values should use explode semantics.
   */
  explode: boolean = false;

  /**
   * Whether this is the property which declares the HTTP content type.
   */
  isContentTypeProperty: boolean = false;

  /**
   * Whether this is the property which declares the HTTP body.
   */
  isBodyProperty: boolean = false;

  #languageMutationNode: MutationNodeForType<ModelProperty>;
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  #wireMutationNode: MutationNodeForType<ModelProperty>;
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The possibly mutated language type for this property.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this property.
   */
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

  /**
   * Whether the type of this property is a nullable union. For the JSON content
   * type, nullable properties are optional on the wire.
   */
  typeIsNullable: boolean = false;

  protected startTypeEdge() {
    return new MutationHalfEdge("type", this, (tail) => {
      this.#languageMutationNode.connectType(tail.languageMutationNode);
      this.#wireMutationNode.connectType(tail.wireMutationNode);
    });
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: ModelProperty,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    const encodingInfo = engine.codecs.encode(sourceType, referenceTypes);

    return {
      mutationKey: options.mutationKey,
      encodingInfo,
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: ModelProperty,
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

    this.isDeclaration = !!this.sourceType.name;
    this.isVisible = isVisible(this.engine.$.program, this.sourceType, this.options.visibility);
    const headerInfo = getHeaderFieldOptions(this.engine.$.program, this.sourceType);
    if (headerInfo) {
      this.isHeader = true;
      this.headerName = headerInfo.name;
      this.explode = !!headerInfo.explode;
    } else {
      const queryInfo = getQueryParamOptions(this.engine.$.program, this.sourceType);

      if (queryInfo) {
        this.isQueryParameter = true;
        this.queryParameterName = queryInfo.name;
        this.explode = !!queryInfo.explode;
      } else {
        const pathInfo = getPathParamOptions(this.engine.$.program, this.sourceType);
        if (pathInfo) {
          this.isPathParameter = true;
          this.pathParameterName = pathInfo.name;
          this.explode = !!pathInfo.explode;
        }
      }
    }

    this.isMetadata = isMetadata(this.engine.$.program, this.sourceType);
    this.isBodyProperty =
      isBody(this.engine.$.program, this.sourceType) ||
      isBodyRoot(this.engine.$.program, this.sourceType);

    this.isContentTypeProperty = this.isHeader && this.headerName.toLowerCase() === "content-type";

    if (
      this.engine.$.union.is(this.sourceType.type) &&
      this.options.contentType === "application/json"
    ) {
      const variants = [...this.sourceType.type.variants.values()];
      if (variants.some((v) => v.type === this.engine.$.intrinsic.null)) {
        this.typeIsNullable = true;
      }
    }

    this.codec = info.encodingInfo?.codec ?? null;
    this.#encodingInfo = info.encodingInfo ?? null;
  }

  /**
   * Apply HTTP canonicalization.
   */
  mutate() {
    if (!this.isVisible) {
      this.#languageMutationNode.delete();
      this.#wireMutationNode.delete();
      return;
    }

    if (this.isMetadata) {
      this.#wireMutationNode.delete();
    }

    const newOptions = this.isHeader
      ? this.options.with({
          location: `header${this.explode ? "-explode" : ""}`,
        })
      : this.isQueryParameter
        ? this.options.with({
            location: `query${this.explode ? "-explode" : ""}`,
          })
        : this.isPathParameter
          ? this.options.with({
              location: `path${this.explode ? "-explode" : ""}`,
            })
          : this.options.with({ location: "body" });

    if (this.typeIsNullable) {
      // nullable things often mean optional things, I guess.
      this.#wireMutationNode.mutate((prop) => {
        prop.optional = true;
      });
    }

    if (this.#encodingInfo) {
      const { languageType, wireType } = this.#encodingInfo;
      if (languageType !== this.sourceType) {
        this.#languageMutationNode = this.#languageMutationNode.replace(
          languageType as ModelProperty,
        ) as MutationNodeForType<ModelProperty>;
      }
      if (wireType !== this.sourceType) {
        this.#wireMutationNode = this.#wireMutationNode.replace(
          wireType as ModelProperty,
        ) as MutationNodeForType<ModelProperty>;
      }
    }

    super.mutate(newOptions);
  }
}
