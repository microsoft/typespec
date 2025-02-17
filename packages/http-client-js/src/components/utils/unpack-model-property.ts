import { isNullType, ModelProperty, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

/**
 * Sometimes a model property type would be another ModelProperty in this case we need to keep unpacking until we find a non Model Property
 * type to get to the actual type.
 * This also handles an HttpPart which needs to be unpacked as well.
 */
export function unpackProperty(modelProperty: ModelProperty): Type {
  const type = $.httpPart.unpack(modelProperty.type) ?? modelProperty.type;
  if ($.modelProperty.is(type)) {
    return unpackProperty(type);
  }

  // Check if it is nullable
  if ($.union.is(type)) {
    const variants = Array.from(type.variants.values());
    const nullVariant = variants.find((v) => isNullType(v.type));
    if (variants.length === 2 && nullVariant) {
      // When the union has only null and another variant unpack the non-null type
      return variants.find((v) => v !== nullVariant)!.type;
    }

    if (variants.length > 2 && nullVariant) {
      const nonNullVariants = variants.filter((v) => v !== nullVariant);
      return $.union.create({ name: type.name, variants: nonNullVariants });
    }
  }

  return type;
}
