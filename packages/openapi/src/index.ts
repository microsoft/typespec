export type {
  DefaultResponseDecorator,
  ExtensionDecorator,
  ExternalDocsDecorator,
  InfoDecorator,
} from "../generated-defs/TypeSpec.OpenAPI.js";
export {
  $defaultResponse,
  $extension,
  $externalDocs,
  $info,
  $operationId,
  getExtensions,
  getExternalDocs,
  getInfo,
  getOperationId,
  isDefaultResponse,
  resolveInfo,
  setExtension,
  setInfo,
} from "./decorators.js";
export {
  checkDuplicateTypeName,
  checkNoAdditionalProperties,
  getOpenAPITypeName,
  getParameterKey,
  isReadonlyProperty,
  resolveOperationId,
  shouldInline,
  validateIsUri,
} from "./helpers.js";
export { AdditionalInfo, Contact, ExtensionKey, ExternalDocs, License } from "./types.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
