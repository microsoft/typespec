import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
@tagMetadata(#[
  #{ name: "parent-tag", description: "A parent tag" },
  #{ name: "child-tag", description: "A child tag", parent: "parent-tag" },
  #{ name: "categorized-tag", description: "A tag with a kind", `x-kind`: "category" }
])
namespace title;

@tag("parent-tag")
@route("/")
@get
op list(): OkResponse;
