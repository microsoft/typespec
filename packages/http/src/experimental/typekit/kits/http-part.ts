import type { Type } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { getHttpPart, HttpPart } from "../../../private.decorators.js";

/**
 * Utilities for working with HTTP Parts.
 * @typekit httpPart
 * @experimental
 */
export interface HttpPartKit {
  /**
   * Check if the model is a HTTP part.
   * @param type model to check
   */
  is(type: Type): boolean;
  /*
   * Get the HTTP part from the model.
   */
  get(type: Type): HttpPart | undefined;
  /**
   * Unpacks the wrapped model from the HTTP part or the original model if
   * not an HttpPart.
   * @param type HttpPart model to unpack
   */
  unpack(type: Type): Type;
}

interface TypekitExtension {
  httpPart: HttpPartKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  httpPart: {
    is(type) {
      return this.model.is(type) && this.httpPart.get(type) !== undefined;
    },
    get(type) {
      return getHttpPart(this.program, type);
    },
    unpack(type) {
      const part = this.httpPart.get(type);
      if (part) {
        return part.type;
      }
      return type;
    },
  },
});
