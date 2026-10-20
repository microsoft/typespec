import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service
@route("/payload/pageable/server-driven-pagination/continuationtoken")
namespace TspTest.ContinuationToken;

model Pet {
  id: string;
  name: string;
}

alias HeaderAndQuery = {
  @header foo?: string;
  @query bar?: string;
};

model BodyPage {
  @pageItems pets: Pet[];
  @continuationToken nextToken?: string;
}

model HeaderPage {
  @pageItems pets: Pet[];
  @header("next-token") @continuationToken nextToken?: string;
}

@list
@route("/request-query-response-body")
op visibleQuery(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Preserve the public cursor parameter."
  @clientOption("includeContinuationTokenParameter", true, "java")
  @query
  @continuationToken
  token?: string,

  ...HeaderAndQuery,
): BodyPage;

@list
@route("/request-header-response-header")
op visibleHeader(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Preserve the public cursor parameter."
  @clientOption("includeContinuationTokenParameter", true, "java")
  @header
  @continuationToken
  token?: string,

  ...HeaderAndQuery,
): HeaderPage;

@list
@route("/request-query-response-header")
op defaultQuery(@query @continuationToken token?: string, ...HeaderAndQuery): HeaderPage;

@list
@route("/request-header-response-body")
op hiddenHeader(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Exercise explicit default behavior."
  @clientOption("includeContinuationTokenParameter", false, "java")
  @header
  @continuationToken
  token?: string,

  ...HeaderAndQuery,
): BodyPage;
