export type { HttpPartOptions } from "../generated-defs/TypeSpec.Http.Private.js";
export { getAuthenticationForOperation, resolveAuthentication } from "./auth.js";
export { getContentTypes } from "./content-types.js";
export {
  $body,
  $bodyIgnore,
  $bodyRoot,
  $cookie,
  $delete,
  $get,
  $head,
  $header,
  $multipartBody,
  $patch,
  $path,
  $post,
  $put,
  $query,
  $server,
  $statusCode,
  $useAuth,
  getAuthentication,
  getCookieParamOptions,
  getHeaderFieldName,
  getHeaderFieldOptions,
  getOperationVerb,
  getPatchOptions,
  getPathParamName,
  getPathParamOptions,
  getQueryParamName,
  getQueryParamOptions,
  getServers,
  getStatusCodeDescription,
  getStatusCodes,
  getStatusCodesWithDiagnostics,
  isBody,
  isBodyIgnore,
  isBodyRoot,
  isCookieParam,
  isHeader,
  isMultipartBodyProperty,
  isPathParam,
  isQueryParam,
  isStatusCode,
  setAuthentication,
  type HttpServer,
} from "./decorators.js";
export { $route, setRoute } from "./decorators/route.js";
export { $sharedRoute, isSharedRoute, setSharedRoute } from "./decorators/shared-route.js";
export { $lib } from "./lib.js";
export { $linter } from "./linter.js";
/** @internal */
export { setStatusCode } from "./decorators.js";
export type { HttpProperty } from "./http-property.js";

import { Visibility as HttpVisibility } from "./metadata.js";

/**
 * Flag enum representation of well-known visibilities that are used in REST APIs.
 *
 * @deprecated Prefer using `VisibilityFilter` from `@typespec/compiler` instead.
 */
export const Visibility = HttpVisibility;
export type Visibility = HttpVisibility;

export {
  createMetadataInfo,
  getVisibilitySuffix,
  HttpVisibilityProvider,
  isApplicableMetadata,
  isApplicableMetadataOrBody,
  isMetadata,
  isVisible,
  resolveRequestVisibility,
  type MetadataInfo,
  type MetadataInfoOptions,
} from "./metadata.js";
export {
  getAllHttpServices,
  getHttpOperation,
  getHttpService,
  isOverloadSameEndpoint,
  listHttpOperationsIn,
  reportIfNoRoutes,
} from "./operations.js";
export { getOperationParameters } from "./parameters.js";
export {
  getHttpFileModel,
  getHttpPart,
  HttpPart,
  isHttpFile,
  isOrExtendsHttpFile,
} from "./private.decorators.js";
export { getResponsesForOperation } from "./responses.js";
export {
  addQueryParamsToUriTemplate,
  getRouteOptionsForNamespace,
  getRoutePath,
  getUriTemplatePathParam,
  joinPathSegments,
} from "./route.js";

export type {
  AnyHttpAuthRef,
  ApiKeyAuth,
  Authentication,
  AuthenticationOption,
  AuthenticationOptionReference,
  AuthenticationReference,
  AuthorizationCodeFlow,
  BasicAuth,
  BearerAuth,
  ClientCredentialsFlow,
  CookieParameterOptions,
  HeaderFieldOptions,
  HttpAuth,
  HttpAuthBase,
  HttpAuthRef,
  HttpBody,
  HttpOperation,
  HttpOperationBody,
  HttpOperationBodyBase,
  HttpOperationCookieParameter,
  HttpOperationFileBody,
  HttpOperationHeaderParameter,
  HttpOperationMultipartBody,
  HttpOperationMultipartPartBody,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationPart,
  HttpOperationPathParameter,
  HttpOperationQueryParameter,
  HttpOperationResponse,
  HttpOperationResponseContent,
  HttpPayloadBody,
  HttpService,
  HttpServiceAuthentication,
  HttpStatusCodeRange,
  HttpStatusCodes,
  HttpStatusCodesEntry,
  HttpVerb,
  ImplicitFlow,
  NoAuth,
  NoHttpAuthRef,
  Oauth2Auth,
  OAuth2Flow,
  OAuth2FlowType,
  OAuth2HttpAuthRef,
  OAuth2Scope,
  OpenIDConnectAuth,
  OperationContainer,
  OperationVerbSelector,
  PasswordFlow,
  PathParameterOptions,
  QueryParameterOptions,
  RoutePath,
} from "./types.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
