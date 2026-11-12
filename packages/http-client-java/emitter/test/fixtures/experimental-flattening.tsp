import "@typespec/http";
import "@typespec/http-client";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.HttpClient;

@service
@server("https://example.com", "Example")
namespace ExperimentalFlattening;

@post
@route("/flattened/{previewPath}")
op flattened(
  @experimental(#{ diagnosticId: "FLAT_QUERY" }) @query previewQuery: string,
  @experimental(#{ diagnosticId: "FLAT_HEADER" }) @header previewHeader: string,
  @experimental(#{ diagnosticId: "FLAT_PATH" }) @path previewPath: string,
  @experimental(#{ diagnosticId: "FLAT_BODY" }) previewBody: string,
  stableBody?: string,
): void;

@post
@route("/grouped")
op grouped(
  @experimental(#{ diagnosticId: "GROUP_QUERY" }) @query previewQuery: string,
  @experimental(#{ diagnosticId: "GROUP_BODY" }) previewBody: string,
  stableOne: string,
  stableTwo: string,
  stableThree: string,
  stableFour: string,

  @experimental(#{ diagnosticId: "GROUP_OPTIONAL" })
  previewOptional?: string,
): void;
