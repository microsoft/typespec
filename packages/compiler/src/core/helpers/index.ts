export {
  DiscriminatedUnion,
  DiscriminatedUnionLegacy,
  getDiscriminatedUnion,
} from "./discriminator-utils.js";
export { getLocationContext } from "./location-context.js";
export { listOperationsIn, type ListOperationOptions } from "./operation-utils.js";
export { interpolatePath } from "./path-interpolation.js";

export { explainStringTemplateNotSerializable } from "./string-template-utils.js";
export { printIdentifier as formatIdentifier, printIdentifier } from "./syntax-utils.js";
export {
  TypeNameOptions,
  getEntityName,
  getNamespaceFullName,
  getTypeName,
  isStdNamespace,
} from "./type-name-utils.js";
export {
  resolveUsages,
  type OperationContainer,
  type TrackableType,
  type UsageFlags,
  type UsageTracker,
} from "./usage-resolver.js";
