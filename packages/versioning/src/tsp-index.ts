import type { TypeSpecVersioningDecorators } from "../generated-defs/TypeSpec.Versioning.js";
import {
  $added,
  $madeOptional,
  $madeRequired,
  $removed,
  $renamedFrom,
  $returnTypeChangedFrom,
  $typeChangedFrom,
  $useDependency,
  $versioned,
} from "./decorators.js";

export { $lib } from "./lib.js";
/** @internal */
export const $decorators = {
  "TypeSpec.Versioning": {
    versioned: $versioned,
    useDependency: $useDependency,
    added: $added,
    removed: $removed,
    renamedFrom: $renamedFrom,
    madeOptional: $madeOptional,
    madeRequired: $madeRequired,
    typeChangedFrom: $typeChangedFrom,
    returnTypeChangedFrom: $returnTypeChangedFrom,
  } satisfies TypeSpecVersioningDecorators,
};
