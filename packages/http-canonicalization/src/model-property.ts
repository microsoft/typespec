import type { MemberType, ModelProperty } from "@typespec/compiler";
import { getHeaderFieldOptions, getQueryParamOptions, isMetadata, isVisible } from "@typespec/http";
import {
  ModelPropertyMutation,
  MutationHalfEdge,
  type MutationNodeForType,
} from "@typespec/mutator-framework";
import { Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes model properties, tracking request/response metadata and visibility.
 */
export class ModelPropertyHttpCanonicalization extends ModelPropertyMutation<
  HttpCanonicalizationMutations,
  HttpCanonicalizationOptions,
  HttpCanonicalizer
> {
  /**
   * Indicates if this property corresponds to a named declaration. Always
   * false.
   */
  isDeclaration: boolean = false;

  /**
   * Whether the property is visible given the current visibility options.
   */
  isVisible: boolean = false;

  /**
   * Codec used to transform the property's type between language and wire views.
   */
  codec: Codec | null = null;

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

  protected startTypeEdge() {
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectType(tail.languageMutationNode);
      this.#wireMutationNode.connectType(tail.wireMutationNode);
    });
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: ModelProperty,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Model properties don't need a codec directly
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
        const pathInfo = getQueryParamOptions(this.engine.$.program, this.sourceType);
        if (pathInfo) {
          this.isPathParameter = true;
          this.pathParameterName = pathInfo.name;
          this.explode = !!pathInfo.explode;
        }
      }
    }
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

    if (isMetadata(this.engine.$.program, this.sourceType)) {
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

    super.mutate(newOptions);
  }
}
