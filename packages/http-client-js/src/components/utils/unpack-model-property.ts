import { isNullType, ModelProperty, Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";

/**
 * Sometimes a model property type would be another ModelProperty in this case we need to keep unpacking until we find a non Model Property
 * type to get to the actual type.
 * This also handles an HttpPart which needs to be unpacked as well.
 */
export function unpackProperty(modelProperty: ModelProperty): Type {
  const { $ } = useTsp();
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
      const nonNullVariant = variants.find((v) => v !== nullVariant)!.type;
      // Recursively unpack if the non-null variant is a ModelProperty
      return $.modelProperty.is(nonNullVariant) ? unpackProperty(nonNullVariant) : nonNullVariant;
    }

    if (variants.length > 2 && nullVariant) {
      const nonNullVariants = variants
        .filter((v) => v !== nullVariant)
        .map((v) => {
          // Recursively unpack each variant if it's a ModelProperty
          const variantType = v.type;
          return {
            ...v,
            type: $.modelProperty.is(variantType) ? unpackProperty(variantType) : variantType,
          };
        });
      return $.union.create({ name: type.name, variants: nonNullVariants });
    }
  }

  return type;
}
