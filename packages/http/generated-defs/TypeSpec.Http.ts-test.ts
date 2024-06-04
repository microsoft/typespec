/** An error here would mean that the decorator is not exported or doesn't have the right name. */
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
} from "@typespec/http";
import type {
  BodyDecorator,
  BodyIgnoreDecorator,
  BodyRootDecorator,
  DeleteDecorator,
  GetDecorator,
  HeadDecorator,
  HeaderDecorator,
  IncludeInapplicableMetadataInPayloadDecorator,
  MultipartBodyDecorator,
  PatchDecorator,
  PathDecorator,
  PostDecorator,
  PutDecorator,
  QueryDecorator,
  RouteDecorator,
  ServerDecorator,
  SharedRouteDecorator,
  StatusCodeDecorator,
  UseAuthDecorator,
} from "./TypeSpec.Http.js";

type Decorators = {
  $statusCode: StatusCodeDecorator;
  $body: BodyDecorator;
  $header: HeaderDecorator;
  $query: QueryDecorator;
  $path: PathDecorator;
  $bodyRoot: BodyRootDecorator;
  $bodyIgnore: BodyIgnoreDecorator;
  $multipartBody: MultipartBodyDecorator;
  $get: GetDecorator;
  $put: PutDecorator;
  $post: PostDecorator;
  $patch: PatchDecorator;
  $delete: DeleteDecorator;
  $head: HeadDecorator;
  $server: ServerDecorator;
  $useAuth: UseAuthDecorator;
  $includeInapplicableMetadataInPayload: IncludeInapplicableMetadataInPayloadDecorator;
  $route: RouteDecorator;
  $sharedRoute: SharedRouteDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $statusCode,
  $body,
  $header,
  $query,
  $path,
  $bodyRoot,
  $bodyIgnore,
  $multipartBody,
  $get,
  $put,
  $post,
  $patch,
  $delete,
  $head,
  $server,
  $useAuth,
  $includeInapplicableMetadataInPayload,
  $route,
  $sharedRoute,
};
