export {
  $added,
  $madeOptional,
  $madeRequired,
  $removed,
  $renamedFrom,
  $returnTypeChangedFrom,
  $typeChangedFrom,
  $useDependency,
  $versioned,
  VersionMap,
  findVersionedNamespace,
  getAddedOnVersions,
  getMadeOptionalOn,
  getRemovedOnVersions,
  getRenamedFrom,
  getRenamedFromVersions,
  getReturnTypeChangedFrom,
  getTypeChangedFrom,
  getUseDependencies,
  getVersion,
} from "./decorators.js";
export { buildVersionProjections, type VersionProjections } from "./projection.js";
export * from "./types.js";
export * from "./validate.js";
export * from "./versioning.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
