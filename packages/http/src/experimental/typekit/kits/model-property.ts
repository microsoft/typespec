import { ModelProperty } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import {
  getHeaderFieldOptions,
  getPathParamOptions,
  getQueryParamOptions,
  isHeader,
  isMultipartBodyProperty,
  isPathParam,
  isQueryParam,
} from "../../../decorators.js";
import { HeaderFieldOptions, PathParameterOptions, QueryParameterOptions } from "../../../types.js";

/**
 * Utilities for working with model properties in the context of Http.
 * @typekit modelProperty
 * @experimental
 */
export interface HttpModelProperty {
  /**
   * Get the Http parameter options for a model property.
   * @param prop a TypeSpec ModelProperty
   */
  getHttpParamOptions(
    prop: ModelProperty,
  ): HeaderFieldOptions | PathParameterOptions | QueryParameterOptions | undefined;
  /**
   * Get the Http header options for a model property.
   * @param prop a TypeSpec ModelProperty
   */
  getHttpHeaderOptions(prop: ModelProperty): HeaderFieldOptions | undefined;
  /**
   * Get the Http path options for a model property.
   * @param prop a TypeSpec ModelProperty
   */
  getHttpPathOptions(prop: ModelProperty): PathParameterOptions | undefined;
  /**
   * Get the Http query options for a model property.
   * @param prop a TypeSpec ModelProperty
   */
  getHttpQueryOptions(prop: ModelProperty): QueryParameterOptions | undefined;
  /**
   * Check if a model property is an Http header.
   * @param prop a TypeSpec ModelProperty
   */
  isHttpHeader(prop: ModelProperty): boolean;
  /**
   * Check if a model property is an Http path parameter.
   * @param prop a TypeSpec ModelProperty
   */
  isHttpPathParam(prop: ModelProperty): boolean;
  /**
   * Check if a model property is an Http query parameter.
   * @param prop a TypeSpec ModelProperty
   */
  isHttpQueryParam(prop: ModelProperty): boolean;
  /**
   * Check if a model property is an Http multipart body.
   * @param prop a TypeSpec ModelProperty
   */
  isHttpMultipartBody(prop: ModelProperty): boolean;
}

interface TypekitExtension {
  modelProperty: HttpModelProperty;
}

declare module "@typespec/compiler/typekit" {
  interface ModelPropertyKit extends HttpModelProperty {}
}

defineKit<TypekitExtension>({
  modelProperty: {
    getHttpParamOptions(prop: ModelProperty) {
      if (isHeader(this.program, prop)) {
        return getHeaderFieldOptions(this.program, prop);
      }

      if (isPathParam(this.program, prop)) {
        return getPathParamOptions(this.program, prop);
      }

      if (isQueryParam(this.program, prop)) {
        return getQueryParamOptions(this.program, prop);
      }

      return undefined;
    },
    getHttpHeaderOptions(prop: ModelProperty) {
      return getHeaderFieldOptions(this.program, prop);
    },
    getHttpPathOptions(prop) {
      return getPathParamOptions(this.program, prop);
    },
    getHttpQueryOptions(prop: ModelProperty) {
      return getQueryParamOptions(this.program, prop);
    },
    isHttpHeader(prop: ModelProperty) {
      return isHeader(this.program, prop);
    },
    isHttpPathParam(prop: ModelProperty) {
      return isPathParam(this.program, prop);
    },
    isHttpQueryParam(prop: ModelProperty) {
      return isQueryParam(this.program, prop);
    },
    isHttpMultipartBody(prop: ModelProperty) {
      return isMultipartBodyProperty(this.program, prop);
    },
  },
});
