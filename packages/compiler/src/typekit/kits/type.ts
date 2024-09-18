import {
  Discriminator,
  getDiscriminatedUnion,
  getDiscriminator,
  isErrorType,
} from "../../core/index.js";
import type { Enum, Model, Scalar, Type, Union } from "../../core/types.js";
import { getDoc, getSummary, resolveEncodedName } from "../../lib/decorators.js";
import { $, defineKit } from "../define-kit.js";
import { getPlausibleName } from "./utils/get-plausible-name.js";

export interface TypeKit {
  /**
   * Checks if a type is decorated with @error
   * @param type The type to check.
   */
  isError(type: Type): boolean;
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
  /**
   * Get the plausible name of a type. If the type has a name, it will use it otherwise it will try generate a name based on the context.
   * If the type can't get a name, it will return an empty string.
   * If the type is a TemplateInstance, it will prefix the name with the template arguments.
   * @param type The scalar to get the name of.z
   */
  getPlausibleName(type: Model | Union | Enum | Scalar): string;
  /**
   * Resolves a discriminated union for the given model or union.
   * @param type Model or Union to resolve the discriminated union for.
   */
  getDiscriminatedUnion(type: Model | Union): Union | undefined;
  /**
   * Resolves the discriminator for a discriminated union. Returns undefined if the type is not a discriminated union.
   * @param type
   */
  getDiscriminator(type: Model | Union): Discriminator | undefined;
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
    isError(type) {
      return isErrorType(type);
    },
    getEncodedName(type, encoding) {
      return resolveEncodedName(this.program, type, encoding);
    },
    getSummary(type) {
      return getSummary(this.program, type);
    },
    getDoc(type) {
      return getDoc(this.program, type);
    },
    getPlausibleName(type) {
      return getPlausibleName(type);
    },
    getDiscriminator(type) {
      return getDiscriminator(this.program, type);
    },
    getDiscriminatedUnion(type) {
      const discriminator = getDiscriminator(this.program, type);

      if (!discriminator) {
        return undefined;
      }

      const [union] = getDiscriminatedUnion(type, discriminator);
      const variants = Array.from(union.variants.entries()).map(([k, v]) =>
        $.unionVariant.create({ name: k, type: v })
      );
      return $.union.create({
        name: union.propertyName,
        variants,
      });
    },
  },
});
