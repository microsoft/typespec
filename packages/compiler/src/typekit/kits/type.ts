import type { Type } from "../../core/types.js";
import { getDoc, getSummary, resolveEncodedName } from "../../lib/decorators.js";
import { defineKit } from "../define-kit.js";

export interface TypeKit {
  /**
   * Get the name of this type in the specified encoding.
   */
  getEncodedName(type: Type & { name: string }, encoding: string): string;

  /**
   * Get the summary of this type as specified by the `@summary` decorator.
   *
   * @param type The type to get the summary for.
   */
  getSummary(type: Type): string | undefined;

  /**
   * Get the documentation of this type as specified by the `@doc` decorator or
   * the JSDoc comment.
   *
   * @param type The type to get the documentation for.
   */
  getDoc(type: Type): string | undefined;
}

interface BaseTypeKit {
  /**
   * Utilities for working with general types.
   */
  type: TypeKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends BaseTypeKit {}
}

defineKit<BaseTypeKit>({
  type: {
    getEncodedName(type, encoding) {
      return resolveEncodedName(this.program, type, encoding);
    },
    getSummary(type) {
      return getSummary(this.program, type);
    },
    getDoc(type) {
      return getDoc(this.program, type);
    },
  },
});
