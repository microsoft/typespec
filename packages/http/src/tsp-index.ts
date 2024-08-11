import { TypeSpecHttpDecorators } from "../generated-defs/TypeSpec.Http.js";
import {
  $body,
  $bodyIgnore,
  $bodyRoot,
  $delete,
  $get,
  $head,
  $header,
  $includeInapplicableMetadataInPayload,
  $multipartBody,
  $patch,
  $path,
  $post,
  $put,
  $query,
  $route,
  $server,
  $sharedRoute,
  $statusCode,
  $useAuth,
} from "./decorators.js";

export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export const $decorators = {
  "TypeSpec.Http": {
    body: $body,
    bodyIgnore: $bodyIgnore,
    bodyRoot: $bodyRoot,
    delete: $delete,
    get: $get,
    header: $header,
    head: $head,
    includeInapplicableMetadataInPayload: $includeInapplicableMetadataInPayload,
    multipartBody: $multipartBody,
    patch: $patch,
    path: $path,
    post: $post,
    put: $put,
    query: $query,
    route: $route,
    server: $server,
    sharedRoute: $sharedRoute,
    statusCode: $statusCode,
    useAuth: $useAuth,
  } satisfies TypeSpecHttpDecorators,
};
