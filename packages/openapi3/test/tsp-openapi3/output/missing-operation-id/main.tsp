import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

@route("/")
@get
// FIXME: Open API operation 'GET /' is missing an operationId. Generated: 'get_root'
op get_root(): OkResponse | {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
} | {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
};

@route("/foo")
@put
// FIXME: Open API operation 'PUT /foo' is missing an operationId. Generated: 'put_foo'
op put_foo(): OkResponse | {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
} | {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
};
