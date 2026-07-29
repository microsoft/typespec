import { Program, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getMergePatchPropertySource, isMergePatch } from "./helpers.js";

export function isMergePatchBody(program: Program, bodyType: Type): boolean {
  const _visitedTypes: WeakMap<Type, boolean> = new WeakMap<Type, boolean>();
  function isMergePatchModel(type: Type): boolean {
    if (_visitedTypes.has(type)) return false;
    _visitedTypes.set(bodyType, true);
    if (!$(program).model.is(type)) return false;
    if (isMergePatch(program, type)) return true;
    if ($(program).array.is(type) || $(program).record.is(type)) {
      return isMergePatchModel(type.indexer!.value!);
    }
    return false;
  }

  switch (bodyType.kind) {
    case "Model":
      return (
        isMergePatchModel(bodyType) ||
        bodyType.sourceModels.some((m) => isMergePatchModel(m.model)) ||
        [...bodyType.properties.values()].some(
          (p) => getMergePatchPropertySource(program, p) !== undefined || isMergePatchModel(p.type),
        )
      );
    case "ModelProperty":
      return isMergePatchModel(bodyType.type);
    case "Union":
      return [...bodyType.variants.values()].some((v) => isMergePatchModel(v.type));
    case "UnionVariant":
      return isMergePatchModel(bodyType.type);
    case "Tuple":
      return bodyType.values.some((v) => isMergePatchModel(v));
    default:
      return false;
  }
}
