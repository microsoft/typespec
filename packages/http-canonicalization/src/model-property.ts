import type { MemberType, ModelProperty } from "@typespec/compiler";
import { getHeaderFieldOptions, getQueryParamOptions, isVisible } from "@typespec/http";
import { ModelPropertyMutation } from "@typespec/mutator-framework";
import { Codec, getJsonEncoderRegistry } from "./codecs.js";
import type {
  HttpCanonicalization,
  HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import type { HttpCanonicalizer } from "./http-canonicalization.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes model properties, tracking request/response metadata and visibility.
 */
export class ModelPropertyHttpCanonicalization extends ModelPropertyMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
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
  codec: Codec;

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
   * The possibly mutated language type for this property.
   */
  get languageType() {
    return this.getMutatedType(this.#languageSubgraph);
  }

  /**
   * The possibly mutated wire type for this property.
   */
  get wireType() {
    return this.getMutatedType(this.#wireSubgraph);
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: ModelProperty,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
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

    const registry = getJsonEncoderRegistry(this.engine.$);
    this.codec = registry.detect(this);
  }

  /**
   * Apply HTTP canonicalization.
   */
  mutate() {
    const languageNode = this.getMutationNode(this.#languageSubgraph);
    const wireNode = this.getMutationNode(this.#wireSubgraph);

    if (!this.isVisible) {
      languageNode.delete();
      wireNode.delete();
      return;
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

    this.type = this.engine.mutateReference(this.sourceType, newOptions) as HttpCanonicalization;
  }
}
