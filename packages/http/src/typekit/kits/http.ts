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
} from "../../decorators.js";
import { HeaderFieldOptions, PathParameterOptions, QueryParameterOptions } from "../../types.js";

export interface HttpModelPropertyKit {
  getHttpHeaderOptions(prop: ModelProperty): HeaderFieldOptions | undefined;
  getHttpPathOptions(prop: ModelProperty): PathParameterOptions | undefined;
  getHttpQueryOptions(prop: ModelProperty): QueryParameterOptions | undefined;
  isHttpHeader(prop: ModelProperty): boolean;
  isHttpPathParam(prop: ModelProperty): boolean;
  isHttpQueryParam(prop: ModelProperty): boolean;
  isHttpMultipartBody(prop: ModelProperty): boolean;
}

interface HttpKit {
  modelProperty: HttpModelPropertyKit;
}

declare module "@typespec/compiler/typekit" {
  interface ModelPropertyKit extends HttpModelPropertyKit {}
}

defineKit<HttpKit>({
  modelProperty: {
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
