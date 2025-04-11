/*
 * This module provides a utility function to recursively unpack a ModelProperty type to reach its underlying type.
 * It handles special cases such as HTTP parts and unions with a nullable variant by "unwrapping" nested ModelProperty types.
 */

import { isNullType, ModelProperty, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

/**
 * Unpacks a ModelProperty to reveal its underlying actionable type.
 *
 * This function handles cases where the given ModelProperty.type is itself another ModelProperty,
 * as well as handling special HttpPart types which need separate unpacking. Additionally, if the type is
 * a union that includes a null variant, this function will detect and unwrap either a simple or complex union.
 *
 * @param modelProperty - The ModelProperty whose underlying type should be determined.
 * @returns The underlying type after recursively unwrapping ModelProperty types and processing nullable unions.
 */
export function unpackProperty(modelProperty: ModelProperty): Type {
  // Attempt to unpack an HTTP part type. If not applicable, use the original type.
  const type = $.httpPart.unpack(modelProperty.type) ?? modelProperty.type;

  // If the type is itself a ModelProperty, recursively unpack it further.
  if ($.modelProperty.is(type)) {
    return unpackProperty(type);
  }

  // Check if the type is a union type (e.g., a type composed of multiple variants).
  if ($.union.is(type)) {
    const variants = Array.from(type.variants.values());
    // Look for a variant that represents a null type; this helps detect optional types.
    const nullVariant = variants.find((v) => isNullType(v.type));

    // If the union consists of exactly two variants, one of which is null, then unpack the non-null variant.
    if (variants.length === 2 && nullVariant) {
      const nonNullVariant = variants.find((v) => v !== nullVariant)!.type;
      // If the non-null variant is a ModelProperty, recursively unpack it.
      return $.modelProperty.is(nonNullVariant) ? unpackProperty(nonNullVariant) : nonNullVariant;
    }

    // If the union has more than two variants and includes a null variant, process each non-null variant.
    if (variants.length > 2 && nullVariant) {
      const nonNullVariants = variants
        .filter((v) => v !== nullVariant)
        .map((v) => {
          // For each variant, if it is a ModelProperty, recursively unpack it.
          const variantType = v.type;
          return {
            ...v,
            type: $.modelProperty.is(variantType) ? unpackProperty(variantType) : variantType,
          };
        });
      // Recreate the union type with the updated non-null variants.
      return $.union.create({ name: type.name, variants: nonNullVariants });
    }
  }

  // Return the final unpacked type if no further conditions apply.
  return type;
}
