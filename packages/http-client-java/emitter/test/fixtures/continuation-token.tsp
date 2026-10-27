import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service
namespace ContinuationToken;

model Item {
  id: string;
}

@list
@route("/query-body")
op queryBody(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
  @clientOption("includeContinuationTokenParameter", true, "java")
  @query
  @continuationToken
  token?: string,
): {
  @pageItems items: Item[];
  next?: {
    @continuationToken token?: string;
  };
};

@list
@route("/header-body")
op headerBody(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
  @clientOption("includeContinuationTokenParameter", false, "java")
  @header
  @continuationToken
  token?: string,
): {
  @pageItems items: Item[];
  @continuationToken nextToken?: string;
};

@list
@route("/query-header")
op queryHeader(@query @continuationToken token?: string): {
  @pageItems items: Item[];
  @header("next-token") @continuationToken nextToken?: string;
};

@list
@route("/header-header")
op headerHeader(
  #suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
  @clientOption("includeContinuationTokenParameter", true, "java")
  @header
  @continuationToken
  token?: string,
): {
  @pageItems items: Item[];
  @header("next-token") @continuationToken nextToken?: string;
};

#suppress "@azure-tools/typespec-client-generator-core/client-option" "Operation options do not control parameter visibility."
@@clientOption(queryHeader, "includeContinuationTokenParameter", true, "java");
