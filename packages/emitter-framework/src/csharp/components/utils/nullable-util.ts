import { useTsp } from "#core/index.js";
import type { Type, Union } from "@typespec/compiler";

/** Get the inner type if the union is a nullable, otherwise return undefined */
export function getNullableUnionInnerType(u: Union): Type | undefined {
  const { $ } = useTsp();
  const isNull = (type: Type) => type === $.intrinsic.null || type === $.intrinsic.void;

  if (Array.from(u.variants.values()).some((v) => isNull(v.type))) {
    const { $ } = useTsp();
    const left = Array.from(u.variants.values()).filter((v) => !isNull(v.type));
    if (left.length === 0) {
      // a union only has null or void?
      return $.intrinsic.void;
    } else if (left.length === 1) {
      return left[0].type;
    } else {
      return $.union.create({
        name: u.name,
        variants: left,
      });
    }
  }
  return undefined;
}
